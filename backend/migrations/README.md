# AI rewrite credits

Apply `001_ai_rewrites.sql` to a local Supabase instance before using AI rewrites. The backend uses a service-role client; mobile clients cannot read or write the subscription and usage tables directly. Subscription plans are provisioned server-side with the canonical values `free` and `pro`.

Free accounts receive 10 rewrites per UTC calendar month. Pro accounts receive unlimited rewrites. `GET /ai/rewrite-credits` returns the signed-in account's allowance. `POST /ai/rewrite` accepts text up to 2,000 characters and returns `rewritten_text`. Rewritten drafts are returned directly and are not stored.

The Settings card shows the remaining allowance and allows users to rewrite a draft. Install `backend/requirements-dev.txt` and run `PYTHONPATH=backend python -m pytest backend/tests` for mocked API checks. The tests prevent dotenv loading while importing the app and mock database and AI calls.
