from datetime import datetime, timedelta, timezone
from functools import wraps
import os

from flask import current_app, g, jsonify, request
from supabase import create_client

FREE_MONTHLY_REVIEWS = 10


def get_review_client():
    return create_client(
        current_app.config['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY']
    )


def review_period(now=None):
    now = now or datetime.now(timezone.utc)
    return now.astimezone(timezone.utc).strftime('%Y-%m-01')


def get_review_credits(client, user_id):
    subscription = client.table('ai_review_subscriptions').select('plan').eq('user_id', user_id).execute()
    plan = subscription.data[0]['plan'] if subscription.data else 'free'
    period = review_period()
    usage = client.table('ai_review_usage').select('used').eq('user_id', user_id).eq('period_start', period).execute()
    used = usage.data[0]['used'] if usage.data else 0
    return {
        'plan': plan,
        'period_start': period,
        'resets_at': (datetime.fromisoformat(period).replace(tzinfo=timezone.utc) + timedelta(days=30)).isoformat(),
        'used': used,
        'limit': None if plan == 'pro' else FREE_MONTHLY_REVIEWS,
        'remaining': None if plan == 'pro' else max(0, FREE_MONTHLY_REVIEWS - used)
    }


def reserve_review(client, user_id, credits):
    if credits['plan'] == 'pro':
        return True
    if credits['used'] >= FREE_MONTHLY_REVIEWS:
        return False
    client.table('ai_review_usage').upsert({
        'user_id': user_id,
        'period_start': credits['period_start'],
        'used': credits['used'] + 1
    }).execute()
    return True


def require_review_credit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            client = get_review_client()
            credits = get_review_credits(client, g.current_user['id'])
            if not reserve_review(client, g.current_user['id'], credits):
                return jsonify({'error': 'Monthly review credits exhausted', 'credits': credits}), 402
            g.review_client = client
            g.review_credits = credits
        except Exception:
            return jsonify({'error': 'Review credits unavailable'}), 503
        return f(*args, **kwargs)

    return decorated_function
