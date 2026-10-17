import json

from flask import current_app, g, jsonify, request
from flask.views import MethodView
from flask_smorest import Blueprint

from src.utils.ai_credits import get_credit_client, get_credit_summary, require_ai_credit
from src.utils.auth import verify_supabase_token
from src.utils.models import Model
from src.utils.prompt_generator import PromptGenerator
from src.utils.rate_limiter import limiter, RATE_LIMITS

blp = Blueprint('AI Credits', __name__, description='AI usage and meal analysis')


@blp.route('/ai/credits')
class AICredits(MethodView):
    @verify_supabase_token
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self):
        try:
            summary = get_credit_summary(get_credit_client(), g.current_user['id'])
            return jsonify({'success': True, 'data': summary}), 200
        except Exception:
            return jsonify({'error': 'AI credits unavailable'}), 503


@blp.route('/ai/analyze')
class AnalyzeMeal(MethodView):
    @verify_supabase_token
    @require_ai_credit
    def post(self):
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get('description'), str):
            return jsonify({'error': 'Please provide a meal description'}), 400
        description = data['description'].strip()
        if not description:
            return jsonify({'error': 'Please provide a meal description'}), 400

        current_app.logger.info('Meal analysis request: %s', data)
        try:
            messages = PromptGenerator().described_food_prompt(description)
            response = Model().gemini_chat_completion(messages)
            nutritional_data = json.loads(response)
            if not isinstance(nutritional_data, dict):
                raise ValueError('Expected nutritional information')
            record = None
            try:
                result = g.ai_credit_client.table('ai_analyses').insert({
                    'user_id': g.current_user['id'],
                    'description': description,
                    'nutritional_analysis': nutritional_data
                }).execute()
                record = result.data[0]
            except Exception:
                current_app.logger.warning('Could not save meal analysis')
            return jsonify({
                'success': True,
                'data': {'nutritional_analysis': nutritional_data, 'analysis': record}
            }), 200
        except Exception:
            return jsonify({'error': 'Meal analysis failed. Please try again.'}), 502


@blp.route('/ai/analyses/<uuid:analysis_id>')
class MealAnalysis(MethodView):
    @verify_supabase_token
    @limiter.limit(RATE_LIMITS['DB_READ'])
    def get(self, analysis_id):
        try:
            result = get_credit_client().table('ai_analyses').select('*').eq('id', str(analysis_id)).execute()
            if not result.data:
                return jsonify({'error': 'Meal analysis not found'}), 404
            return jsonify({'success': True, 'data': result.data[0]}), 200
        except Exception:
            return jsonify({'error': 'Could not load meal analysis'}), 503
