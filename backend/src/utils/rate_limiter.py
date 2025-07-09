"""
Rate Limiting Configuration for API Endpoints

This module provides rate limiting functionality using Flask-Limiter.
Different endpoints have different rate limits based on their resource intensity.
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import g
import os
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

# Rate limiting configurations for different operation types
RATE_LIMITS = {
    # AI-powered operations (most resource intensive)
    'AI_ANALYSIS': '30 per hour',  # Very strict - AI analysis is expensive
    
    # File upload operations (resource intensive)  
    'FILE_UPLOAD': '30 per hour',  # Moderate - file processing takes resources
    
    # Database write operations (moderate resource usage)
    'DB_WRITE': '100 per hour',  # More lenient for simple CRUD operations
    
    # Database read operations (least resource intensive)
    'DB_READ': '200 per hour',  # Most lenient for read operations
    
    # User profile operations (moderate)
    'USER_PROFILE': '50 per hour',
    
    # Authentication operations
    'AUTH': '30 per hour'
}

def create_limiter(app):
    """
    Create and configure the Flask-Limiter instance.
    """
    # Use Redis if available (better for production), otherwise use in-memory
    storage_uri = os.getenv('REDIS_URL', 'memory://')
    
    limiter = Limiter(
        app=app,
        key_func=get_user_id,
        storage_uri=storage_uri,
        default_limits=["1000 per hour"],  # Global fallback limit
        headers_enabled=True,  # Include rate limit info in response headers
    )
    
    return limiter 