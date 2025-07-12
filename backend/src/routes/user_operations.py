from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask import jsonify, g, request, current_app
import os
import pandas as pd
import json
from werkzeug.utils import secure_filename
from src.utils.auth import verify_supabase_token
from src.utils.rate_limiter import limiter, RATE_LIMITS
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
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self):
        """Get user's recently consumed food items from a specific date (defaults to today)"""
        
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
            
            # Get query parameters for pagination
            limit = request.args.get('limit', 3, type=int)  # Default 3 items (last 3)
            offset = request.args.get('offset', 0, type=int)  # Default no offset
            
            # Limit the maximum items to prevent large queries
            if limit > 100:
                limit = 100
            
            print(f"Fetching recent foods for user: {g.current_user['id']} for date: {target_date}")
            
            # Get the target date range
            date_start = datetime.combine(target_date, datetime.min.time()).isoformat()
            date_end = datetime.combine(target_date + timedelta(days=1), datetime.min.time()).isoformat()
            
            # Query the foods_consumed table for user's recent food from the specified date
            result = supabase.table('foods_consumed') \
                .select('*') \
                .eq('user_id', g.current_user['id']) \
                .gte('created_at', date_start) \
                .lt('created_at', date_end) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
            
            if not result.data:
                return jsonify({
                    'success': True,
                    'message': f'No food records found for {target_date}',
                    'data': {
                        'date': target_date.isoformat(),
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
                # Get portion size (default to 1 if not set)
                portion = float(food.get('portion'))
                
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
                
                # Use stored nutritional values (do not multiply by portion)
                base_protein = float(food['protein']) if food['protein'] else 0
                base_carbs = float(food['carbs']) if food['carbs'] else 0
                base_fats = float(food['fats']) if food['fats'] else 0
                base_calories = float(food['calories']) if food['calories'] else 0
                
                formatted_food = {
                    'id': food['id'],
                    'name': food['name'],
                    'emoji': food['emoji'],
                    'protein': round(base_protein, 2),
                    'carbs': round(base_carbs, 2),
                    'fats': round(base_fats, 2),
                    'calories': round(base_calories, 2),
                    'portion': portion,
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
                'message': f'Retrieved {len(formatted_foods)} recent food items for {target_date}',
                'data': {
                    'date': target_date.isoformat(),
                    'foods': formatted_foods,
                    'count': len(formatted_foods)
                }
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
    @limiter.limit(RATE_LIMITS['DB_READ'])
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
            
            for food in result.data:
                # Get portion size (default to 1 if not set)
                portion = float(food.get('portion'))
                
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
                
                # Use stored nutritional values (do not multiply by portion)
                base_protein = float(food['protein']) if food['protein'] else 0
                base_carbs = float(food['carbs']) if food['carbs'] else 0
                base_fats = float(food['fats']) if food['fats'] else 0
                base_calories = float(food['calories']) if food['calories'] else 0
                
                formatted_food = {
                    'id': food['id'],
                    'name': food['name'],
                    'emoji': food['emoji'],
                    'protein': round(base_protein, 2),
                    'carbs': round(base_carbs, 2),
                    'fats': round(base_fats, 2),
                    'calories': round(base_calories, 2),
                    'portion': portion,
                    'photo_url': photo_url,
                    'created_at': food['created_at']
                }
                
                formatted_foods.append(formatted_food)
            
            print(f"Found {len(formatted_foods)} food records")
            
            return jsonify({
                'success': True,
                'message': f'Retrieved {len(formatted_foods)} recent food items',
                'data': {
                    'foods': formatted_foods,
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
    @limiter.limit(RATE_LIMITS['DB_READ'])
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
                .select('protein, carbs, fats, calories, portion') \
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
                # Get portion size (default to 1 if not set)
                # portion = float(food.get('portion'))
                # Do NOT multiply by portion; just sum the stored values
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

@blp.route('/update_streak')
class UpdateStreak(MethodView):
    @verify_supabase_token  
    @limiter.limit(RATE_LIMITS['DB_WRITE'])
    def post(self):
        """Update user's streak based on whether they hit their daily calorie goal"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get user's profile including current streak and daily calorie goal
            profile_result = supabase.table('user_profiles') \
                .select('daily_calories, streak, streak_update_date') \
                .eq('user_id', g.current_user['id']) \
                .execute()
            
            if not profile_result.data:
                return jsonify({
                    'error': 'User profile not found',
                    'message': 'Please complete your profile setup first'
                }), 404
            
            # Check if streak was already updated today (compare dates only)
            streak_update_date = profile_result.data[0].get('streak_update_date')
            print(f"Streak update date: {streak_update_date}")
            if streak_update_date:
                # Parse the stored date and compare with today's date
                stored_date = datetime.fromisoformat(streak_update_date.replace('Z', '+00:00')).date()
                today_date = datetime.now().date()
                print(f"Stored date: {stored_date}")
                print(f"Today date: {today_date}")
                if stored_date == today_date:
                    return jsonify({
                        'error': 'Streak already updated today',
                        'message': 'You can only update your streak once per day'
                    }), 400

            user_profile = profile_result.data[0]
            daily_calorie_goal = float(user_profile['daily_calories']) if user_profile['daily_calories'] else 0
            current_streak = int(user_profile['streak'])
            
            # Update the streak in the database
            today_iso = datetime.now().isoformat()
            today_date = datetime.now().date().isoformat()
            
            update_result = supabase.table('user_profiles') \
                .update({
                    'streak': current_streak + 1,
                    'updated_at': today_iso,
                    'streak_update_date': today_iso
                }) \
                .eq('user_id', g.current_user['id']) \
                .execute()
            
            if not update_result.data:
                raise Exception("Failed to update streak in database")
            
            # Also add a record to the user_streaks table for today
            streak_record_result = supabase.table('user_streaks') \
                .insert({
                    'user_id': g.current_user['id'],
                    'streak_date': today_date
                }) \
                .execute()
            
            if not streak_record_result.data:
                # If inserting streak record fails, we should rollback the profile update
                # For now, just log the error but don't fail the request since the main streak was updated
                print(f"Warning: Failed to insert streak record for user {g.current_user['id']} on {today_date}")
            
            updated_profile = update_result.data[0]
            
            return jsonify({
                'success': True,
                'streak': updated_profile['streak']
            }), 200
            
        except Exception as e:
            print(f"Error updating streak: {e}")
            return jsonify({
                'error': 'Failed to update streak',
                'message': str(e)
            }), 500

@blp.route('/get_streak')
class GetStreak(MethodView):
    @verify_supabase_token
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self):
        """Get user's current streak information"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get user's current streak from profile
            profile_result = supabase.table('user_profiles') \
                .select('streak, daily_calories, updated_at') \
                .eq('user_id', g.current_user['id']) \
                .execute()
            
            if not profile_result.data:
                return jsonify({
                    'error': 'User profile not found',
                    'message': 'Please complete your profile setup first'
                }), 404
            
            user_profile = profile_result.data[0]
            current_streak = int(user_profile['streak']) if user_profile['streak'] else 0
            daily_calorie_goal = float(user_profile['daily_calories']) if user_profile['daily_calories'] else 0
            last_updated = user_profile.get('updated_at')
            
            # Get last 31 days of streak data
            thirty_one_days_ago = (datetime.now().date() - timedelta(days=31)).isoformat()
            today = datetime.now().date().isoformat()
            
            streak_history_result = supabase.table('user_streaks') \
                .select('streak_date') \
                .eq('user_id', g.current_user['id']) \
                .gte('streak_date', thirty_one_days_ago) \
                .lte('streak_date', today) \
                .order('streak_date', desc=True) \
                .execute()
            
            # Format streak dates
            streak_dates = []
            if streak_history_result.data:
                streak_dates = [record['streak_date'] for record in streak_history_result.data]

            return jsonify({
                'success': True,
                'message': 'Streak information retrieved successfully',
                'data': {
                    'current_streak': current_streak,
                    'daily_calorie_goal': round(daily_calorie_goal, 2),
                    'last_updated': last_updated,
                    'user_id': g.current_user['id'],
                    'streak_history': streak_dates
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching streak: {e}")
            return jsonify({
                'error': 'Failed to fetch streak',
                'message': str(e)
            }), 500

@blp.route('/weekly_recently_eaten')
class WeeklyRecentlyEaten(MethodView):
    @verify_supabase_token
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self):
        """Get user's recently consumed food items for the last 5 days"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get limit parameter for each day (default 3 items per day)
            daily_limit = request.args.get('daily_limit', 3, type=int)
            
            # Limit the maximum items per day to prevent large queries
            if daily_limit > 20:
                daily_limit = 20
            
            print(f"Fetching weekly recent foods for user: {g.current_user['id']}")
            
            # Calculate the last 5 days
            today = datetime.now().date()
            weekly_data = {}
            
            for i in range(5):  # Last 5 days including today
                target_date = today - timedelta(days=i)
                date_key = target_date.isoformat()
                
                # Get the target date range
                date_start = datetime.combine(target_date, datetime.min.time()).isoformat()
                date_end = datetime.combine(target_date + timedelta(days=1), datetime.min.time()).isoformat()
                
                # Query the foods_consumed table for user's food from this specific date
                result = supabase.table('foods_consumed') \
                    .select('*') \
                    .eq('user_id', g.current_user['id']) \
                    .gte('created_at', date_start) \
                    .lt('created_at', date_end) \
                    .order('created_at', desc=True) \
                    .limit(daily_limit) \
                    .execute()
                
                # Format the food records for this date
                formatted_foods = []
                daily_calories = 0
                daily_protein = 0
                daily_carbs = 0
                daily_fats = 0
                
                for food in result.data:
                    # Get portion size (default to 1 if not set)
                    portion = float(food.get('portion'))
                    
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
                    
                    # Use stored nutritional values (do not multiply by portion)
                    base_protein = float(food['protein']) if food['protein'] else 0
                    base_carbs = float(food['carbs']) if food['carbs'] else 0
                    base_fats = float(food['fats']) if food['fats'] else 0
                    base_calories = float(food['calories']) if food['calories'] else 0
                    
                    formatted_food = {
                        'id': food['id'],
                        'name': food['name'],
                        'emoji': food['emoji'],
                        'protein': round(base_protein, 2),
                        'carbs': round(base_carbs, 2),
                        'fats': round(base_fats, 2),
                        'calories': round(base_calories, 2),
                        'portion': portion,
                        'photo_url': photo_url,
                        'created_at': food['created_at']
                    }
                    
                    # Add to daily totals
                    daily_calories += formatted_food['calories']
                    daily_protein += formatted_food['protein']
                    daily_carbs += formatted_food['carbs']
                    daily_fats += formatted_food['fats']
                    
                    formatted_foods.append(formatted_food)
                
                # Store data for this date
                weekly_data[date_key] = {
                    'foods': formatted_foods,
                    'count': len(formatted_foods),
                    'daily_totals': {
                        'calories': round(daily_calories, 2),
                        'protein': round(daily_protein, 2),
                        'carbs': round(daily_carbs, 2),
                        'fats': round(daily_fats, 2)
                    }
                }
            
            return jsonify({
                'success': True,
                'message': f'Retrieved recent food items for the last 5 days',
                'data': {
                    'weekly_foods': weekly_data,
                    'user_id': g.current_user['id'],
                    'date_range': {
                        'start_date': (today - timedelta(days=4)).isoformat(),
                        'end_date': today.isoformat()
                    }
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching weekly recent foods: {e}")
            return jsonify({
                'error': 'Failed to fetch weekly food records',
                'message': str(e)
            }), 500

@blp.route('/weekly_daily_nutrition_summary')
class WeeklyDailyNutritionSummary(MethodView):
    @verify_supabase_token
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self):
        """Get user's daily nutrition summary for the last 5 days with consumed vs goals"""
        try:
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Get user's daily goals from profile (fetch once for all days)
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
            
            # Get daily goals (handle None values)
            goal_calories = float(user_goals['daily_calories']) if user_goals['daily_calories'] else 0
            goal_protein = float(user_goals['daily_protein_g']) if user_goals['daily_protein_g'] else 0
            goal_carbs = float(user_goals['daily_carbs_g']) if user_goals['daily_carbs_g'] else 0
            goal_fats = float(user_goals['daily_fats_g']) if user_goals['daily_fats_g'] else 0
            
            print(f"Fetching weekly nutrition summary for user: {g.current_user['id']}")
            
            # Calculate the last 5 days
            today = datetime.now().date()
            weekly_data = {}
            
            for i in range(5):  # Last 5 days including today
                target_date = today - timedelta(days=i)
                date_key = target_date.isoformat()
                
                # Get the target date and next day in ISO format for filtering
                date_start = target_date.isoformat()
                date_end = (target_date + timedelta(days=1)).isoformat()
                
                # Get consumed foods for this target date
                foods_result = supabase.table('foods_consumed') \
                    .select('protein, carbs, fats, calories, portion') \
                    .eq('user_id', g.current_user['id']) \
                    .gte('created_at', date_start) \
                    .lt('created_at', date_end) \
                    .execute()
                
                # Calculate consumed totals for this date
                consumed_calories = 0
                consumed_protein = 0
                consumed_carbs = 0
                consumed_fats = 0
                
                for food in foods_result.data:
                    # Do NOT multiply by portion; just sum the stored values
                    consumed_calories += float(food['calories']) if food['calories'] else 0
                    consumed_protein += float(food['protein']) if food['protein'] else 0
                    consumed_carbs += float(food['carbs']) if food['carbs'] else 0
                    consumed_fats += float(food['fats']) if food['fats'] else 0
                
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
                
                # Store data for this date
                weekly_data[date_key] = {
                    'consumed_today': {
                        'calories': round(consumed_calories, 2),
                        'protein': round(consumed_protein, 2),
                        'carbs': round(consumed_carbs, 2),
                        'fats': round(consumed_fats, 2)
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
            
            return jsonify({
                'success': True,
                'message': 'Weekly nutrition summary retrieved successfully',
                'data': {
                    'weekly_nutrition': weekly_data,
                    'daily_goals': {
                        'calories': round(goal_calories, 2),
                        'protein': round(goal_protein, 2),
                        'carbs': round(goal_carbs, 2),
                        'fats': round(goal_fats, 2)
                    },
                    'user_id': g.current_user['id'],
                    'date_range': {
                        'start_date': (today - timedelta(days=4)).isoformat(),
                        'end_date': today.isoformat()
                    }
                }
            }), 200
            
        except Exception as e:
            print(f"Error fetching weekly nutrition summary: {e}")
            return jsonify({
                'error': 'Failed to fetch weekly nutrition summary',
                'message': str(e)
            }), 500

