"""
User Profiles API Routes

Handles user profile creation, updates, and daily target calculations.
"""

from flask import jsonify, request, g, current_app
from flask.views import MethodView
from flask_smorest import Blueprint
from datetime import datetime, date
import json
import os
from supabase import create_client, Client

from ..utils.auth import verify_supabase_token
from ..utils.nutrition_calculator import NutritionCalculator, DailyTargets

from dotenv import load_dotenv

load_dotenv()
blp = Blueprint('user_profiles', __name__, description='User Profiles Operations')


@blp.route("/user_profiles")
class UserProfilesView(MethodView):
    
    @verify_supabase_token
    def post(self):
        """Create or update user profile with onboarding data"""
        try:
            data = request.get_json()
            user_id = g.current_user['id']
            
            # Validate required fields
            required_fields = [
                'gender', 'activity_level', 'tracking_difficulty', 'experience_level',
                'height_unit', 'height_value', 'weight_unit', 'weight_value',
                'date_of_birth', 'main_goal', 'dietary_preference'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            # Convert date string to date object
            try:
                dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }), 400
            
            # Calculate daily targets using Python utility
            try:
                targets = NutritionCalculator.calculate_daily_targets(
                    gender=data['gender'],
                    activity_level=data['activity_level'],
                    height_unit=data['height_unit'],
                    height_value=float(data['height_value']),
                    height_inches=data.get('height_inches'),
                    weight_unit=data['weight_unit'],
                    weight_value=float(data['weight_value']),
                    date_of_birth=dob,
                    main_goal=data['main_goal'],
                    dietary_preference=data['dietary_preference']
                )
            except Exception as e:
                return jsonify({
                    'error': f'Error calculating daily targets: {str(e)}'
                }), 400
            
            # Prepare profile data for database
            profile_data = {
                'user_id': user_id,
                'gender': data['gender'],
                'activity_level': data['activity_level'],
                'tracking_difficulty': data['tracking_difficulty'],
                'experience_level': data['experience_level'],
                'height_unit': data['height_unit'],
                'height_value': data['height_value'],
                'height_inches': data.get('height_inches'),
                'weight_unit': data['weight_unit'],
                'weight_value': data['weight_value'],
                'date_of_birth': dob.isoformat(),
                'main_goal': data['main_goal'],
                'dietary_preference': data['dietary_preference'],
                'daily_calories': targets.calories,
                'daily_protein_g': targets.protein_g,
                'daily_carbs_g': targets.carbs_g,
                'daily_fats_g': targets.fats_g,
                'onboarding_completed': True
            }
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Check if profile already exists
            existing_profile_result = supabase.table('user_profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .execute()
            
            if existing_profile_result.data:
                # Update existing profile
                result = supabase.table('user_profiles') \
                    .update(profile_data) \
                    .eq('user_id', user_id) \
                    .execute()
                
                if result.data:
                    saved_record = result.data[0]
                    message = 'Profile updated successfully'
                else:
                    raise Exception("No data returned from database update")
            else:
                # Insert new profile
                result = supabase.table('user_profiles') \
                    .insert(profile_data) \
                    .execute()
                
                if result.data:
                    saved_record = result.data[0]
                    message = 'Profile created successfully'
                else:
                    raise Exception("No data returned from database insert")
            
            return jsonify({
                'message': message,
                'profile': saved_record,
                'daily_targets': {
                    'calories': targets.calories,
                    'protein_g': targets.protein_g,
                    'carbs_g': targets.carbs_g,
                    'fats_g': targets.fats_g
                }
            }), 201
            
            
        except Exception as e:
            return jsonify({
                'error': f'Failed to create profile: {str(e)}'
            }), 500
    
    @verify_supabase_token
    def get(self):
        """Get user profile"""
        try:
            user_id = g.current_user['id']
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Fetch user profile from database
            result = supabase.table('user_profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .execute()
            
            if not result.data:
                return jsonify({
                    'message': 'No profile found for user',
                    'user_id': user_id,
                    'profile': None
                }), 404
            
            profile = result.data[0]
            
            return jsonify({
                'message': 'Profile retrieved successfully',
                'user_id': user_id,
                'profile': profile,
                'daily_targets': {
                    'calories': profile.get('daily_calories'),
                    'protein_g': profile.get('daily_protein_g'),
                    'carbs_g': profile.get('daily_carbs_g'),
                    'fats_g': profile.get('daily_fats_g')
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': f'Failed to get profile: {str(e)}'
            }), 500

@blp.route("/recalculate")
class RecalculateTargetsView(MethodView):
    
    @verify_supabase_token
    def post(self):
        """Recalculate daily targets for existing profile"""
        try:
            user_id = g.current_user['id']
            
            # Initialize Supabase client
            supabase_url = current_app.config['SUPABASE_URL']
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Fetch current profile from database
            result = supabase.table('user_profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .execute()
            
            if not result.data:
                return jsonify({
                    'error': 'No profile found for user. Please complete onboarding first.',
                    'user_id': user_id
                }), 404
            
            profile = result.data[0]
            
            # Convert date string back to date object for calculation
            try:
                dob = datetime.strptime(profile['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date format in stored profile'
                }), 400
            
            # Recalculate targets using current profile data
            targets = NutritionCalculator.calculate_daily_targets(
                gender=profile['gender'],
                activity_level=profile['activity_level'],
                height_unit=profile['height_unit'],
                height_value=float(profile['height_value']),
                height_inches=profile.get('height_inches'),
                weight_unit=profile['weight_unit'],
                weight_value=float(profile['weight_value']),
                date_of_birth=dob,
                main_goal=profile['main_goal'],
                dietary_preference=profile['dietary_preference']
            )
            
            # Update profile with new targets
            update_data = {
                'daily_calories': targets.calories,
                'daily_protein_g': targets.protein_g,
                'daily_carbs_g': targets.carbs_g,
                'daily_fats_g': targets.fats_g,
                'updated_at': datetime.now().isoformat()
            }
            
            update_result = supabase.table('user_profiles') \
                .update(update_data) \
                .eq('user_id', user_id) \
                .execute()
            
            if not update_result.data:
                raise Exception("No data returned from database update")
            
            updated_profile = update_result.data[0]
            
            return jsonify({
                'message': 'Daily targets recalculated successfully',
                'user_id': user_id,
                'profile': updated_profile,
                'daily_targets': {
                    'calories': targets.calories,
                    'protein_g': targets.protein_g,
                    'carbs_g': targets.carbs_g,
                    'fats_g': targets.fats_g
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': f'Failed to recalculate targets: {str(e)}'
            }), 500 