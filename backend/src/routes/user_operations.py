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

blp = Blueprint('History', __name__, description='History Operations')

@blp.route('/recently_eaten')
class RecentlyEaten(MethodView):
    @verify_supabase_token
    def get(self):
        """Get user's recently consumed food items"""
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
                # Get photo URL if photo_path exists
                photo_url = None
                if food.get('photo_path'):
                    try:
                        photo_url = supabase.storage.from_('food-images').get_public_url(food['photo_path'])
                    except Exception as e:
                        print(f"Warning: Could not generate public URL for photo {food['photo_path']}: {str(e)}")
                
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
                # Get photo URL if photo_path exists
                photo_url = None
                if food.get('photo_path'):
                    try:
                        photo_url = supabase.storage.from_('food-images').get_public_url(food['photo_path'])
                    except Exception as e:
                        print(f"Warning: Could not generate public URL for photo {food['photo_path']}: {str(e)}")
                
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
