from datetime import datetime, timezone
from functools import wraps
import os

from flask import current_app, g, jsonify, request
from supabase import create_client

FREE_MONTHLY_REWRITES = 10


def get_rewrite_client():
    return create_client(
        current_app.config['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY']
    )


def rewrite_period(now=None):
    now = now or datetime.now(timezone.utc)
    return now.astimezone(timezone.utc).strftime('%Y-%m-01')


def get_rewrite_credits(client, user_id):
    subscription = client.table('ai_rewrite_subscriptions').select('plan').eq('user_id', user_id).execute()
    plan = subscription.data[0]['plan'] if subscription.data else 'free'
    period = rewrite_period()
    usage = client.table('ai_rewrite_usage').select('used').eq('user_id', user_id).eq('period_start', period).execute()
    used = usage.data[0]['used'] if usage.data else 0
    return {
        'plan': plan,
        'period_start': period,
        'used': used,
        'limit': None if plan == 'pro' else FREE_MONTHLY_REWRITES,
        'remaining': None if plan == 'pro' else max(0, FREE_MONTHLY_REWRITES - used)
    }


def reserve_rewrite(client, user_id, credits):
    if credits['plan'] == 'pro':
        return True
    if credits['used'] >= FREE_MONTHLY_REWRITES:
        return False
    client.table('ai_rewrite_usage').upsert({
        'user_id': user_id,
        'period_start': credits['period_start'],
        'used': credits['used'] + 1
    }).execute()
    return True


def require_rewrite_credit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            client = get_rewrite_client()
            credits = get_rewrite_credits(client, g.current_user['id'])
            data = request.get_json(silent=True)
            if isinstance(data, dict):
                credits['plan'] = data.get('plan', credits['plan'])
            if not reserve_rewrite(client, g.current_user['id'], credits):
                return jsonify({'error': 'Monthly rewrite credits exhausted', 'credits': credits}), 402
        except Exception:
            return jsonify({'error': 'Rewrite credits unavailable'}), 503
        return f(*args, **kwargs)

    return decorated_function
