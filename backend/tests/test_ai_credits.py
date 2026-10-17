import json
from types import SimpleNamespace
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


def test_credit_summary_requires_authentication(client):
    http, headers = client
    assert http.get('/ai/credits').status_code == 401


def test_credit_summary_for_new_account(client):
    http, headers = client
    database = MagicMock()
    database.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    database.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    with patch('src.routes.ai_credits.get_credit_client', return_value=database):
        response = http.get('/ai/credits', headers=headers)
    assert response.status_code == 200
    assert response.json['data']['remaining'] == 10
    assert response.json['data']['plan'] == 'free'


def test_meal_description_returns_nutrition(client):
    http, headers = client
    database = MagicMock()
    database.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    database.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    database.rpc.return_value.execute.return_value.data = True
    database.table.return_value.insert.return_value.execute.return_value = SimpleNamespace(data=[{'id': 'analysis-id'}])
    nutrition = {'name': 'Eggs', 'calories': 140}
    with patch('src.utils.ai_credits.get_credit_client', return_value=database), \
            patch.object(Model, 'gemini_chat_completion', return_value=json.dumps(nutrition)):
        response = http.post('/ai/analyze', headers=headers, json={'description': 'Two eggs'})
    assert response.status_code == 200
    assert response.json['data']['nutritional_analysis'] == nutrition
    assert response.json['data']['analysis']['id'] == 'analysis-id'
