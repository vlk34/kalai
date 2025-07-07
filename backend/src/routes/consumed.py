from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask import jsonify, g, request, current_app
import os
import pandas as pd
import json
from werkzeug.utils import secure_filename
from src.utils.auth import verify_supabase_token
import uuid
from datetime import datetime
from supabase import create_client, Client
import tempfile
import io
from src.utils.models import Model
from src.utils.prompt_generator import PromptGenerator
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

blp = Blueprint('Consumed', __name__, description='Consumed Operations')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@blp.route('/consumed')
class Consumed(MethodView):
    @verify_supabase_token
    def post(self):
        try:
            # Check if the request contains a file
            if 'photo' not in request.files:
                return jsonify({
                    'error': 'No photo file provided',
                    'message': 'Please upload a photo'
                }), 400
            
            file = request.files['photo']
            
            # Check if file was actually selected
            if file.filename == '':
                return jsonify({
                    'error': 'No file selected',
                    'message': 'Please select a photo to upload'
                }), 400
            
            # Validate file type
            if not allowed_file(file.filename):
                return jsonify({
                    'error': 'Invalid file type',
                    'message': 'Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP)'
                }), 400
            
            # Secure the filename
            filename = secure_filename(file.filename)
            
            # Always store images in WEBP format to save storage space
            unique_filename = f"{uuid.uuid4()}.webp"
            
            # Get file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)  # Reset file pointer
            
            # Check file size (limit to 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if file_size > max_size:
                return jsonify({
                    'error': 'File too large',
                    'message': 'Please upload an image smaller than 10MB'
                }), 400
            
            # Read original file bytes
            original_content = file.read()

            # Load the image using Pillow
            image = Image.open(io.BytesIO(original_content))

            # Convert and compress the image to WEBP format in-memory
            webp_io = io.BytesIO()
            # Ensure compatibility (e.g. remove alpha channel) before saving as WEBP
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            image.save(webp_io, format="WEBP", quality=50)
            webp_io.seek(0)

            # Final bytes to upload
            file_content = webp_io.getvalue()

            # Update file size to reflect the WEBP payload
            file_size = len(file_content)
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Upload photo to Supabase Storage
            try:
                # Create storage path: food-photos/user_id/unique_filename
                storage_path = f"food-photos/{g.current_user['id']}/{unique_filename}"
                
                # Upload to Supabase Storage - if this succeeds without exception, upload is successful
                supabase.storage.from_('food-images').upload(
                    file=file_content,
                    path=storage_path,
                    file_options={
                        "content-type": "image/webp",
                        "upsert": False
                    }
                )
                
                print(f"Successfully uploaded photo to storage path: {storage_path}")
                    
            except Exception as e:
                return jsonify({
                    'error': 'Failed to upload photo to storage',
                    'message': f'Could not save photo: {str(e)}'
                }), 500

            model = Model()
            prompt_generator = PromptGenerator()

            messages = prompt_generator.consumed_food_prompt(image)

            response = model.gemini_chat_completion(messages)
            
            # Parse the JSON response from Gemini
            try:
                # Clean the response in case there are extra characters
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    # Remove markdown code block formatting if present
                    cleaned_response = cleaned_response.replace('```json\n', '').replace('\n```', '')
                
                nutritional_data = json.loads(cleaned_response)
                
            except json.JSONDecodeError as e:
                return jsonify({
                    'error': 'Failed to parse nutritional data',
                    'message': f'AI response was not valid JSON: {str(e)}',
                    'raw_response': response
                }), 500
            
            # Save to Supabase Foods_consumed table
            try:
                # Prepare data for database insertion
                food_record = {
                    'user_id': g.current_user['id'],
                    'name': nutritional_data.get('name', 'Unknown Food'),
                    'emoji': nutritional_data.get('emoji', '🍽️'),
                    'protein': float(nutritional_data.get('protein', 0)),
                    'carbs': float(nutritional_data.get('carbs', 0)),
                    'fats': float(nutritional_data.get('fats', 0)),
                    'calories': float(nutritional_data.get('calories', 0)),
                    'photo_path': storage_path
                }
                
                # Insert into Foods_consumed table
                result = supabase.table('foods_consumed').insert(food_record).execute()
                
                if result.data:
                    saved_record = result.data[0]
                else:
                    raise Exception("No data returned from database insert")
                    
            except Exception as e:
                return jsonify({
                    'error': 'Failed to save to database',
                    'message': f'Could not save nutritional data: {str(e)}',
                    'nutritional_data': nutritional_data
                }), 500
            
            # Get signed URL for the uploaded photo (expires in 1 hour)
            try:
                photo_url_response = supabase.storage.from_('food-images').create_signed_url(storage_path, 3600)  # 3600 seconds = 1 hour
                
                # Handle different possible response structures
                if isinstance(photo_url_response, dict):
                    photo_url = photo_url_response.get('signedURL') or photo_url_response.get('signedUrl')
                elif isinstance(photo_url_response, str):
                    photo_url = photo_url_response
                else:
                    photo_url = None
                    
                print(f"Generated signed URL for photo: {photo_url is not None}")
                    
            except Exception as e:
                print(f"Warning: Could not generate signed URL for photo: {str(e)}")
                photo_url = None
            
            return jsonify({
                'success': True,
                'message': 'Photo uploaded, analyzed, and saved successfully',
                'data': {
                    'file_info': {
                        'original_filename': filename,
                        'unique_filename': unique_filename,
                        'file_size': file_size,
                        'file_type': 'image/webp',
                        'user_id': g.current_user['id'],
                        'uploaded_at': datetime.now().isoformat(),
                        'storage_path': storage_path,
                        'photo_url': photo_url
                    },
                    'nutritional_analysis': nutritional_data,
                    'database_record': saved_record
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Upload failed',
                'message': str(e)
            }), 500

@blp.route('/edit_with_ai')
class EditWithAI(MethodView):
    @verify_supabase_token
    def post(self):
        try:
            # Get request data
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Please provide food_id and text_description'
                }), 400
            
            food_id = data.get('food_id')
            text_description = data.get('text_description')
            
            if not food_id:
                return jsonify({
                    'error': 'Missing food_id',
                    'message': 'Please provide a valid food_id'
                }), 400
            
            if not text_description:
                return jsonify({
                    'error': 'Missing text_description',
                    'message': 'Please provide a text description for more accurate analysis'
                }), 400
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get the existing food record
            try:
                result = supabase.table('foods_consumed').select('*').eq('id', food_id).eq('user_id', g.current_user['id']).execute()
                
                if not result.data:
                    return jsonify({
                        'error': 'Food record not found',
                        'message': 'No food record found with the provided ID for this user'
                    }), 404
                
                existing_record = result.data[0]
                photo_path = existing_record.get('photo_path')
                
                if not photo_path:
                    return jsonify({
                        'error': 'No photo found',
                        'message': 'This food record does not have an associated photo'
                    }), 400
                    
            except Exception as e:
                return jsonify({
                    'error': 'Failed to retrieve food record',
                    'message': f'Could not retrieve food record: {str(e)}'
                }), 500
            
            # Download the image from Supabase Storage
            try:
                # Download the image file
                image_response = supabase.storage.from_('food-images').download(photo_path)
                
                if not image_response:
                    return jsonify({
                        'error': 'Failed to download image',
                        'message': 'Could not retrieve the image from storage'
                    }), 500
                
                # Convert bytes to PIL Image
                image = Image.open(io.BytesIO(image_response))
                
            except Exception as e:
                return jsonify({
                    'error': 'Failed to process image',
                    'message': f'Could not process the stored image: {str(e)}'
                }), 500
            
            # Use AI to re-analyze with text description
            try:
                model = Model()
                prompt_generator = PromptGenerator()
                
                messages = prompt_generator.consumed_food_prompt_with_description(image, text_description)
                response = model.gemini_chat_completion(messages)
                
                # Parse the JSON response from Gemini
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response.replace('```json\n', '').replace('\n```', '')
                
                nutritional_data = json.loads(cleaned_response)
                
            except json.JSONDecodeError as e:
                return jsonify({
                    'error': 'Failed to parse nutritional data',
                    'message': f'AI response was not valid JSON: {str(e)}',
                    'raw_response': response
                }), 500
            except Exception as e:
                return jsonify({
                    'error': 'AI analysis failed',
                    'message': f'Could not analyze the food: {str(e)}'
                }), 500
            
            # Update the database record
            try:
                update_data = {
                    'name': nutritional_data.get('name', existing_record['name']),
                    'emoji': nutritional_data.get('emoji', existing_record['emoji']),
                    'protein': float(nutritional_data.get('protein', 0)),
                    'carbs': float(nutritional_data.get('carbs', 0)),
                    'fats': float(nutritional_data.get('fats', 0)),
                    'calories': float(nutritional_data.get('calories', 0))
                }
                
                result = supabase.table('foods_consumed').update(update_data).eq('id', food_id).eq('user_id', g.current_user['id']).execute()
                
                if not result.data:
                    raise Exception("No data returned from database update")
                
                updated_record = result.data[0]
                
            except Exception as e:
                return jsonify({
                    'error': 'Failed to update database',
                    'message': f'Could not update nutritional data: {str(e)}',
                    'nutritional_data': nutritional_data
                }), 500
            
            # Get signed URL for the photo (expires in 1 hour)
            try:
                photo_url_response = supabase.storage.from_('food-images').create_signed_url(photo_path, 3600)
                
                if isinstance(photo_url_response, dict):
                    photo_url = photo_url_response.get('signedURL') or photo_url_response.get('signedUrl')
                elif isinstance(photo_url_response, str):
                    photo_url = photo_url_response
                else:
                    photo_url = None
                    
            except Exception as e:
                print(f"Warning: Could not generate signed URL for photo: {str(e)}")
                photo_url = None
            
            return jsonify({
                'success': True,
                'message': 'Food record updated successfully with improved analysis',
                'data': {
                    'food_id': food_id,
                    'text_description': text_description,
                    'photo_url': photo_url,
                    'original_analysis': {
                        'name': existing_record['name'],
                        'emoji': existing_record['emoji'],
                        'protein': existing_record['protein'],
                        'carbs': existing_record['carbs'],
                        'fats': existing_record['fats'],
                        'calories': existing_record['calories']
                    },
                    'updated_analysis': nutritional_data,
                    'database_record': updated_record
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Edit failed',
                'message': str(e)
            }), 500
        
@blp.route('/edit_consumed_food')
class EditConsumedFood(MethodView):
    """Manually edit a consumed food record (name & macronutrients)"""

    @verify_supabase_token
    def put(self):
        try:
            data = request.get_json()

            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Please provide at least food_id and one field to update'
                }), 400

            food_id = data.get('food_id')

            if not food_id:
                return jsonify({
                    'error': 'Missing food_id',
                    'message': 'Please provide a valid food_id of the record to edit'
                }), 400

            # Build update payload – only include provided fields
            updatable_fields = ['name', 'protein', 'carbs', 'fats', 'calories', 'portion']
            update_payload = {}
            for field in updatable_fields:
                if field in data and data[field] is not None:
                    # Convert numeric fields to float, keep name as-is
                    if field in ['protein', 'carbs', 'fats', 'calories', 'portion']:
                        try:
                            update_payload[field] = float(data[field])
                        except (TypeError, ValueError):
                            return jsonify({
                                'error': f'Invalid value for {field}',
                                'message': f"{field.capitalize()} must be a number"
                            }), 400
                    else:
                        update_payload[field] = data[field]

            if not update_payload:
                return jsonify({
                    'error': 'No valid fields provided',
                    'message': f'Provide at least one of: {", ".join(updatable_fields)}'
                }), 400

            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)

            # Perform update and fetch updated record
            result = supabase.table('foods_consumed') \
                .update(update_payload) \
                .eq('id', food_id) \
                .eq('user_id', g.current_user['id']) \
                .execute()

            if not result.data:
                return jsonify({
                    'error': 'Food record not found or not updated',
                    'message': 'Ensure the food_id is correct and belongs to the current user'
                }), 404

            updated_record = result.data[0]

            return jsonify({
                'success': True,
                'message': 'Food record updated successfully',
                'data': updated_record
            }), 200

        except Exception as e:
            return jsonify({
                'error': 'Edit failed',
                'message': str(e)
            }), 500

@blp.route('/delete_consumed_food')
class DeleteConsumedFood(MethodView):
    """Delete a consumed food record"""

    @verify_supabase_token
    def delete(self):
        try:
            data = request.get_json()

            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Please provide food_id'
                }), 400

            food_id = data.get('food_id')

            if not food_id:
                return jsonify({
                    'error': 'Missing food_id',
                    'message': 'Please provide a valid food_id of the record to delete'
                }), 400

            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)

            # First, get the record to check ownership and get photo path
            try:
                result = supabase.table('foods_consumed') \
                    .select('*') \
                    .eq('id', food_id) \
                    .eq('user_id', g.current_user['id']) \
                    .execute()

                if not result.data:
                    return jsonify({
                        'error': 'Food record not found',
                        'message': 'No food record found with the provided ID for this user'
                    }), 404

                record_to_delete = result.data[0]
                photo_path = record_to_delete.get('photo_path')

            except Exception as e:
                return jsonify({
                    'error': 'Failed to retrieve food record',
                    'message': f'Could not retrieve food record: {str(e)}'
                }), 500

            # Delete the record from database
            try:
                delete_result = supabase.table('foods_consumed') \
                    .delete() \
                    .eq('id', food_id) \
                    .eq('user_id', g.current_user['id']) \
                    .execute()

                if not delete_result.data:
                    return jsonify({
                        'error': 'Failed to delete record',
                        'message': 'Record could not be deleted from database'
                    }), 500

            except Exception as e:
                return jsonify({
                    'error': 'Database deletion failed',
                    'message': f'Could not delete record from database: {str(e)}'
                }), 500

            # Optionally delete the photo from storage
            photo_deleted = False
            if photo_path:
                try:
                    supabase.storage.from_('food-images').remove([photo_path])
                    photo_deleted = True
                    print(f"Successfully deleted photo from storage: {photo_path}")
                except Exception as e:
                    print(f"Warning: Could not delete photo from storage: {str(e)}")
                    # Don't fail the entire operation if photo deletion fails

            return jsonify({
                'success': True,
                'message': 'Food record deleted successfully',
                'data': {
                    'deleted_record': record_to_delete,
                    'photo_deleted': photo_deleted,
                    'photo_path': photo_path
                }
            }), 200

        except Exception as e:
            return jsonify({
                'error': 'Delete failed',
                'message': str(e)
            }), 500

