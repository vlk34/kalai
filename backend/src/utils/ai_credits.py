from datetime import datetime, timedelta, timezone
from functools import wraps
import os

from flask import current_app, g, jsonify, request
from supabase import create_client

FREE_MONTHLY_CREDITS = 10


def get_credit_client():
    return create_client(
        current_app.config['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY']
    )


def credit_period(now=None):
    now = now or datetime.now(timezone.utc)
    return (now - timedelta(days=1)).strftime('%Y-%m-01')


def is_unlimited(plan):
    return plan == 'Pro'


def get_credit_summary(client, user_id):
    subscription = client.table('ai_subscriptions').select('plan').eq('user_id', user_id).execute()
    plan = subscription.data[0]['plan'] if subscription.data else 'free'
    period = credit_period()
    usage = client.table('ai_credit_usage').select('used').eq('user_id', user_id).eq('period_start', period).execute()
    used = usage.data[0]['used'] if usage.data else 0
    return {
        'plan': plan,
        'period_start': period,
        'used': used,
        'limit': None if is_unlimited(plan) else FREE_MONTHLY_CREDITS,
        'remaining': None if is_unlimited(plan) else max(0, FREE_MONTHLY_CREDITS - used)
    }


def reserve_credit(client, user_id, summary):
    if is_unlimited(summary['plan']):
        return True
    if summary['used'] >= FREE_MONTHLY_CREDITS:
        return False
    client.table('ai_credit_usage').upsert({
        'user_id': user_id,
        'period_start': summary['period_start'],
        'used': summary['used'] + 1
    }).execute()
    return True


def require_ai_credit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            client = get_credit_client()
            summary = get_credit_summary(client, g.current_user['id'])
            data = request.get_json(silent=True)
            if isinstance(data, dict):
                summary['plan'] = data.get('plan', summary['plan'])
            if not reserve_credit(client, g.current_user['id'], summary):
                return jsonify({'error': 'Monthly AI credits exhausted', 'credits': summary}), 402
            g.ai_credit_client = client
        except Exception:
            return jsonify({'error': 'AI credits unavailable'}), 503
        return f(*args, **kwargs)

    return decorated_function
