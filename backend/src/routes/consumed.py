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
            
            # Generate unique filename with UUID
            file_extension = filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            
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
            
            # Read file content
            file_content = file.read()
            
            # Convert bytes back to PIL Image for the prompt generator
            image = Image.open(io.BytesIO(file_content))
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Upload photo to Supabase Storage
            try:
                # Reset file pointer for storage upload
                file.seek(0)
                
                # Create storage path: food-photos/user_id/unique_filename
                storage_path = f"food-photos/{g.current_user['id']}/{unique_filename}"
                
                # Upload to Supabase Storage
                storage_response = supabase.storage.from_('food-images').upload(
                    file=file_content,
                    path=storage_path,
                    file_options={
                        "content-type": file.content_type,
                        "upsert": False
                    }
                )
                
                if storage_response.status_code != 200:
                    raise Exception(f"Storage upload failed: {storage_response}")
                    
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
            
            # Get public URL for the uploaded photo
            try:
                photo_url = supabase.storage.from_('food-images').get_public_url(storage_path)
            except Exception as e:
                print(f"Warning: Could not generate public URL for photo: {str(e)}")
                photo_url = None
            
            return jsonify({
                'success': True,
                'message': 'Photo uploaded, analyzed, and saved successfully',
                'data': {
                    'file_info': {
                        'original_filename': filename,
                        'unique_filename': unique_filename,
                        'file_size': file_size,
                        'file_type': file.content_type,
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



