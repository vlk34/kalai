"""
Rate Limiting Configuration for API Endpoints

This module provides rate limiting functionality using Flask-Limiter.
Different endpoints have different rate limits based on their resource intensity.
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import g
from dotenv import load_dotenv

load_dotenv()

def get_user_id():
    """
    Get user ID for rate limiting key.
    Falls back to IP address if user is not authenticated.
    """
    if hasattr(g, 'current_user') and g.current_user:
        return f"user:{g.current_user['id']}"
    return f"ip:{get_remote_address()}"

# Create the limiter instance without an app object.
limiter = Limiter(
    key_func=get_user_id,
    headers_enabled=True,  # Include rate limit info in response headers
)

# Rate limiting configurations for different operation types
RATE_LIMITS = {
    # AI-powered operations (most resource intensive)
    'AI_ANALYSIS': '50 per hour',  # Very strict - AI analysis is expensive
    
    # File upload operations (resource intensive)  
    'FILE_UPLOAD': '50 per hour',  # Moderate - file processing takes resources
    
    # Database write operations (moderate resource usage)
    'DB_WRITE': '200 per hour',  # More lenient for simple CRUD operations
    
    # Database read operations (least resource intensive)
    'DB_READ': '500 per hour',  # Most lenient for read operations
    
    # User profile operations (moderate)
    'USER_PROFILE': '100 per hour',
    
    # Authentication operations
    'AUTH': '100 per hour'
} 