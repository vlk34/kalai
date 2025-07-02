from flask import Flask, jsonify, request, g
from flask_smorest import Api
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv(override=True)


def create_app():
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
                 "origins": ["http://localhost:5173", "http://127.0.0.1:5500", "http://localhost:5500"],
                 "methods": ["GET", "POST", "OPTIONS", "PATCH", "DELETE"],
                 "allow_headers": ["Content-Type", "Authorization"]
             }
         })

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

    # Register your blueprints here
    from src.routes.consumed import blp as consumed_blp
    from src.routes.user_operations import blp as user_operations_blp
    api.register_blueprint(consumed_blp)
    api.register_blueprint(user_operations_blp)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)