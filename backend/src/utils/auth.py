from flask import jsonify, g, request
import jwt
import os
from functools import wraps

def verify_supabase_token(f):
    """Decorator to verify Supabase JWT tokens"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401

        token = auth_header.split(' ')[1]

        try:
            # Get JWT secret from environment
            jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
            
            # Verify and decode the JWT token using Supabase JWT secret
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=['HS256'],
                audience='authenticated'
            )
            
            # Store user info in Flask's g object for use in routes
            g.current_user = {
                'id': payload.get('sub'),
                'email': payload.get('email'),
                'role': payload.get('role', 'authenticated')
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except jwt.InvalidAudienceError:
            return jsonify({'error': 'Invalid token audience'}), 401
        except Exception as e:
            print(f"JWT verification error: {str(e)}")
            return jsonify({'error': 'Token verification failed'}), 401

        # Call the actual function after successful authentication
        return f(*args, **kwargs)

    return decorated_function 