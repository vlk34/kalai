from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask import jsonify, g, request, current_app
import os
import pandas as pd
import json
from werkzeug.utils import secure_filename
from src.utils.auth import verify_supabase_token
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
import tempfile
import io
from src.utils.models import Model
from src.utils.prompt_generator import PromptGenerator
from PIL import Image
from dotenv import load_dotenv

blp = Blueprint('History', __name__, description='History Operations')

@blp.route('/recently_eaten')
class RecentlyEaten(MethodView):
    @verify_supabase_token
    def get(self):
        """Get user's recently consumed food items from today only"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get query parameters for pagination
            limit = request.args.get('limit', 3, type=int)  # Default 3 items (last 3)
            offset = request.args.get('offset', 0, type=int)  # Default no offset
            
            # Limit the maximum items to prevent large queries
            if limit > 100:
                limit = 100
            
            print(f"Fetching recent foods for user: {g.current_user['id']}")
            
            # Get today's date range
            today = datetime.now().date()
            today_start = datetime.combine(today, datetime.min.time()).isoformat()
            today_end = datetime.combine(today + timedelta(days=1), datetime.min.time()).isoformat()
            
            # Query the foods_consumed table for user's recent food from today only
            result = supabase.table('foods_consumed') \
                .select('*') \
                .eq('user_id', g.current_user['id']) \
                .gte('created_at', today_start) \
                .lt('created_at', today_end) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
            
            if not result.data:
                return jsonify({
                    'success': True,
                    'message': 'No food records found for today',
                    'data': {
                        'foods': [],
                        'total_count': 0,
                        'user_id': g.current_user['id']
                    }
                }), 200
            
            # Format the food records
            formatted_foods = []
            total_calories = 0
            total_protein = 0
            total_carbs = 0
            total_fats = 0
            
            for food in result.data:
                # Get signed URL if photo_path exists
                photo_url = None
                if food.get('photo_path'):
                    try:
                        photo_url_response = supabase.storage.from_('food-images').create_signed_url(food['photo_path'], 3600)  # 1 hour expiry
                        
                        # Handle different possible response structures
                        if isinstance(photo_url_response, dict):
                            photo_url = photo_url_response.get('signedURL') or photo_url_response.get('signedUrl')
                        elif isinstance(photo_url_response, str):
                            photo_url = photo_url_response
                        else:
                            photo_url = None
                            
                    except Exception as e:
                        print(f"Warning: Could not generate signed URL for photo {food['photo_path']}: {str(e)}")
                
                formatted_food = {
                    'id': food['id'],
                    'name': food['name'],
                    'emoji': food['emoji'],
                    'protein': float(food['protein']) if food['protein'] else 0,
                    'carbs': float(food['carbs']) if food['carbs'] else 0,
                    'fats': float(food['fats']) if food['fats'] else 0,
                    'calories': float(food['calories']) if food['calories'] else 0,
                    'photo_url': photo_url,
                    'created_at': food['created_at']
                }
                
                # Add to totals
                total_calories += formatted_food['calories']
                total_protein += formatted_food['protein']
                total_carbs += formatted_food['carbs']
                total_fats += formatted_food['fats']
                
                formatted_foods.append(formatted_food)
            
            print(f"Found {len(formatted_foods)} food records")
            
            return jsonify({
                'foods': formatted_foods,
            }), 200
            
        except Exception as e:
            print(f"Error fetching recent foods: {e}")
            return jsonify({
                'error': 'Failed to fetch food records',
                'message': str(e)
            }), 500
        
@blp.route('/full_history')
class FullHistory(MethodView):
    @verify_supabase_token
    def get(self):
        """Get user's full history of consumed food items"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get query parameters for pagination
            limit = request.args.get('limit', 20, type=int)  # Default 20 items
            offset = request.args.get('offset', 0, type=int)  # Default no offset
            
            # Limit the maximum items to prevent large queries
            if limit > 100:
                limit = 100
            
            print(f"Fetching recent foods for user: {g.current_user['id']}")
            
            # Query the foods_consumed table for user's recent food
            result = supabase.table('foods_consumed') \
                .select('*') \
                .eq('user_id', g.current_user['id']) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
            
            if not result.data:
                return jsonify({
                    'success': True,
                    'message': 'No food records found',
                    'data': {
                        'foods': [],
                        'total_count': 0,
                        'user_id': g.current_user['id']
                    }
                }), 200
            
            # Format the food records
            formatted_foods = []
            total_calories = 0
            total_protein = 0
            total_carbs = 0
            total_fats = 0
            
            for food in result.data:
                # Get signed URL if photo_path exists
                photo_url = None
                if food.get('photo_path'):
                    try:
                        photo_url_response = supabase.storage.from_('food-images').create_signed_url(food['photo_path'], 3600)  # 1 hour expiry
                        
                        # Handle different possible response structures
                        if isinstance(photo_url_response, dict):
                            photo_url = photo_url_response.get('signedURL') or photo_url_response.get('signedUrl')
                        elif isinstance(photo_url_response, str):
                            photo_url = photo_url_response
                        else:
                            photo_url = None
                            
                    except Exception as e:
                        print(f"Warning: Could not generate signed URL for photo {food['photo_path']}: {str(e)}")
                
                formatted_food = {
                    'id': food['id'],
                    'name': food['name'],
                    'emoji': food['emoji'],
                    'protein': float(food['protein']) if food['protein'] else 0,
                    'carbs': float(food['carbs']) if food['carbs'] else 0,
                    'fats': float(food['fats']) if food['fats'] else 0,
                    'calories': float(food['calories']) if food['calories'] else 0,
                    'photo_url': photo_url,
                    'created_at': food['created_at']
                }
                
                # Add to totals
                total_calories += formatted_food['calories']
                total_protein += formatted_food['protein']
                total_carbs += formatted_food['carbs']
                total_fats += formatted_food['fats']
                
                formatted_foods.append(formatted_food)
            
            print(f"Found {len(formatted_foods)} food records")
            
            return jsonify({
                'success': True,
                'message': f'Retrieved {len(formatted_foods)} recent food items',
                'data': {
                    'foods': formatted_foods,
                    'daily_totals': {
                        'calories': round(total_calories, 2),
                        'protein': round(total_protein, 2),
                        'carbs': round(total_carbs, 2),
                        'fats': round(total_fats, 2)
                    },
                    'pagination': {
                        'limit': limit,
                        'offset': offset,
                        'count': len(formatted_foods)
                    },
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching recent foods: {e}")
            return jsonify({
                'error': 'Failed to fetch food records',
                'message': str(e)
            }), 500

@blp.route('/daily_nutrition_summary')
class DailyNutritionSummary(MethodView):
    @verify_supabase_token
    def get(self):
        """Get user's daily nutrition summary with consumed vs goals for a specific date"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get date parameter from query string, default to today if not provided
            date_param = request.args.get('date')
            
            if date_param:
                try:
                    # Validate and parse the provided date
                    target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'error': 'Invalid date format',
                        'message': 'Date must be in YYYY-MM-DD format'
                    }), 400
            else:
                # Default to today if no date provided
                target_date = datetime.now().date()
            
            # Get the target date and next day in ISO format for filtering
            today = target_date.isoformat()
            tomorrow = (target_date + timedelta(days=1)).isoformat()
            
            print(f"Fetching daily nutrition summary for user: {g.current_user['id']} for date: {today}")
            
            # Get consumed foods for the target date
            foods_result = supabase.table('foods_consumed') \
                .select('protein, carbs, fats, calories') \
                .eq('user_id', g.current_user['id']) \
                .gte('created_at', today) \
                .lt('created_at', tomorrow) \
                .execute()
            
            # Get user's daily goals from profile
            profile_result = supabase.table('user_profiles') \
                .select('daily_calories, daily_protein_g, daily_carbs_g, daily_fats_g') \
                .eq('user_id', g.current_user['id']) \
                .execute()
            
            if not profile_result.data:
                return jsonify({
                    'error': 'User profile not found',
                    'message': 'Please complete your profile setup first'
                }), 404
            
            user_goals = profile_result.data[0]
            
            # Calculate consumed totals for the target date
            consumed_calories = 0
            consumed_protein = 0
            consumed_carbs = 0
            consumed_fats = 0
            
            for food in foods_result.data:
                consumed_calories += float(food['calories']) if food['calories'] else 0
                consumed_protein += float(food['protein']) if food['protein'] else 0
                consumed_carbs += float(food['carbs']) if food['carbs'] else 0
                consumed_fats += float(food['fats']) if food['fats'] else 0
            
            # Get daily goals (handle None values)
            goal_calories = float(user_goals['daily_calories']) if user_goals['daily_calories'] else 0
            goal_protein = float(user_goals['daily_protein_g']) if user_goals['daily_protein_g'] else 0
            goal_carbs = float(user_goals['daily_carbs_g']) if user_goals['daily_carbs_g'] else 0
            goal_fats = float(user_goals['daily_fats_g']) if user_goals['daily_fats_g'] else 0
            
            # Calculate remaining amounts (can be negative if exceeded)
            remaining_calories = goal_calories - consumed_calories
            remaining_protein = goal_protein - consumed_protein
            remaining_carbs = goal_carbs - consumed_carbs
            remaining_fats = goal_fats - consumed_fats
            
            # Calculate percentages achieved
            calories_percentage = (consumed_calories / goal_calories * 100) if goal_calories > 0 else 0
            protein_percentage = (consumed_protein / goal_protein * 100) if goal_protein > 0 else 0
            carbs_percentage = (consumed_carbs / goal_carbs * 100) if goal_carbs > 0 else 0
            fats_percentage = (consumed_fats / goal_fats * 100) if goal_fats > 0 else 0
            
            return jsonify({
                'success': True,
                'message': 'Daily nutrition summary retrieved successfully',
                'data': {
                    'date': today,
                    'consumed_today': {
                        'calories': round(consumed_calories, 2),
                        'protein': round(consumed_protein, 2),
                        'carbs': round(consumed_carbs, 2),
                        'fats': round(consumed_fats, 2)
                    },
                    'daily_goals': {
                        'calories': round(goal_calories, 2),
                        'protein': round(goal_protein, 2),
                        'carbs': round(goal_carbs, 2),
                        'fats': round(goal_fats, 2)
                    },
                    'remaining_to_goal': {
                        'calories': round(remaining_calories, 2),
                        'protein': round(remaining_protein, 2),
                        'carbs': round(remaining_carbs, 2),
                        'fats': round(remaining_fats, 2)
                    },
                    'progress_percentage': {
                        'calories': round(calories_percentage, 1),
                        'protein': round(protein_percentage, 1),
                        'carbs': round(carbs_percentage, 1),
                        'fats': round(fats_percentage, 1)
                    },
                    'foods_consumed_count': len(foods_result.data),
                    'goals_status': {
                        'calories_exceeded': consumed_calories > goal_calories,
                        'protein_exceeded': consumed_protein > goal_protein,
                        'carbs_exceeded': consumed_carbs > goal_carbs,
                        'fats_exceeded': consumed_fats > goal_fats
                    }
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching daily nutrition summary: {e}")
            return jsonify({
                'error': 'Failed to fetch daily nutrition summary',
                'message': str(e)
            }), 500

