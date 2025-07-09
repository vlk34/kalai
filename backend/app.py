from flask import Flask, jsonify, request, g
from flask_smorest import Api
from flask_cors import CORS
import os
from dotenv import load_dotenv
from src.utils.rate_limiter import create_limiter, RATE_LIMITS

load_dotenv(override=True)

# Global limiter instance that will be initialized in create_app
limiter = None

def register_rate_limits(app, limiter):
    """Register rate limits for specific endpoints after blueprints are loaded"""
    
    # AI-powered endpoints (most restrictive)
    limiter.limit(RATE_LIMITS['AI_ANALYSIS'], per_method=True)(app.view_functions.get('Consumed.post'))
    limiter.limit(RATE_LIMITS['AI_ANALYSIS'], per_method=True)(app.view_functions.get('EditWithAI.post'))
    
    # Database write operations
    limiter.limit(RATE_LIMITS['DB_WRITE'], per_method=True)(app.view_functions.get('EditConsumedFood.put'))
    limiter.limit(RATE_LIMITS['DB_WRITE'], per_method=True)(app.view_functions.get('DeleteConsumedFood.delete'))
    
    # User profile operations
    limiter.limit(RATE_LIMITS['USER_PROFILE'], per_method=True)(app.view_functions.get('UserProfilesView.post'))
    limiter.limit(RATE_LIMITS['USER_PROFILE'], per_method=True)(app.view_functions.get('UserProfilesView.get'))
    
    # Database read operations
    limiter.limit(RATE_LIMITS['DB_READ'], per_method=True)(app.view_functions.get('RecentlyEaten.get'))
    limiter.limit(RATE_LIMITS['DB_READ'], per_method=True)(app.view_functions.get('FullHistory.get'))
    limiter.limit(RATE_LIMITS['DB_READ'], per_method=True)(app.view_functions.get('GetStreak.get'))
    limiter.limit(RATE_LIMITS['DB_READ'], per_method=True)(app.view_functions.get('WeeklyDailyNutritionSummary.get'))
    
    # Write operations for streaks
    limiter.limit(RATE_LIMITS['DB_WRITE'], per_method=True)(app.view_functions.get('UpdateStreak.post'))

def create_app():
    global limiter
    app = Flask(__name__)

    # Basic Flask configuration
    app.config["API_TITLE"] = "API with Supabase Auth"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

    # Supabase configuration
    app.config['SUPABASE_URL'] = os.getenv('SUPABASE_URL')
    app.config['SUPABASE_JWT_SECRET'] = os.getenv('SUPABASE_JWT_SECRET')

    # CORS configuration for frontend
    CORS(app,
         supports_credentials=True,
         resources={
             r"/*": {
                 "origins": ["http://localhost:5173", "http://127.0.0.1:5500", "http://localhost:5500", '*'],
                 "methods": ["GET", "POST", "OPTIONS", "PATCH", "DELETE", "PUT"],
                 "allow_headers": ["Content-Type", "Authorization"]
             }
         })

    # Initialize rate limiter
    limiter = create_limiter(app)

    # Make limiter available to other modules
    app.limiter = limiter

    api = Api(app)

    # Import the centralized auth decorator
    from src.utils.auth import verify_supabase_token

    # Example protected route
    @app.route('/protected')
    @verify_supabase_token
    def protected_route():
        return jsonify({
            'message': 'This is a protected route',
            'user': g.current_user
        })

    # Example public route
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy'})

    # Rate limit info endpoint
    @app.route('/rate-limit-info')
    def rate_limit_info():
        """Get current rate limiting information"""
        from src.utils.rate_limiter import RATE_LIMITS
        return jsonify({
            'rate_limits': RATE_LIMITS,
            'current_limits': {
                'global': "1000 per hour"
            }
        })

    # Register your blueprints here
    from src.routes.consumed import blp as consumed_blp
    from src.routes.user_operations import blp as user_operations_blp
    from src.routes.user_profiles import blp as user_profiles_blp
    api.register_blueprint(consumed_blp)
    api.register_blueprint(user_operations_blp)
    api.register_blueprint(user_profiles_blp)

    # Register rate limits after blueprints are loaded
    with app.app_context():
        register_rate_limits(app, limiter)

    return app


# Create the app instance for gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') != 'production'
    app.run(port=port, debug=debug, host='0.0.0.0')
    