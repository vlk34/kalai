import json
from unittest.mock import MagicMock, patch

import jwt
import pytest

with patch('dotenv.load_dotenv', return_value=False):
    from app import create_app

from src.utils.models import Model


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv('SUPABASE_JWT_SECRET', 'local-test-signing-key-with-32-bytes')
    monkeypatch.setenv('GEMINI_API_KEY', 'local-test-key')
    app = create_app()
    app.config.update(TESTING=True)
    token = jwt.encode({
        'sub': '11111111-1111-4111-8111-111111111111',
        'aud': 'authenticated'
    }, 'local-test-signing-key-with-32-bytes', algorithm='HS256')
    return app.test_client(), {'Authorization': f'Bearer {token}'}


def test_review_requires_authentication(client):
    http, headers = client
    assert http.post('/ai/review', json={'text': 'A draft'}).status_code == 401


def test_new_account_has_ten_reviews(client):
    http, headers = client
    database = MagicMock()
    database.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    database.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    with patch('src.routes.ai_reviews.get_review_client', return_value=database):
        response = http.get('/ai/review-credits', headers=headers)
    assert response.status_code == 200
    assert response.json['data']['remaining'] == 10
    assert response.json['data']['plan'] == 'free'


def test_review_returns_summary_and_suggestions(client):
    http, headers = client
    database = MagicMock()
    database.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    database.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    database.rpc.return_value.execute.return_value.data = True
    result = {'summary': 'A useful draft.', 'suggestions': [{'severity': 'low', 'message': 'Shorten the opening.'}]}
    with patch('src.utils.review_credits.get_review_client', return_value=database), \
            patch.object(Model, 'gemini_chat_completion', return_value=json.dumps(result)):
        response = http.post('/ai/review', headers=headers, json={'text': 'A draft'})
    assert response.status_code == 200
    assert response.json['data']['review'] == result
