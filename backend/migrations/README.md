# AI review credits

Apply `001_ai_reviews.sql` to a local Supabase instance before using AI reviews. The backend uses a service-role client; mobile clients cannot read or write subscription and usage tables directly. Subscription plans are provisioned server-side with the values `free` and `pro`.

Free accounts receive 10 AI reviews per UTC calendar month. Pro accounts receive unlimited reviews. `GET /ai/review-credits` returns the signed-in account's allowance and next reset date. `POST /ai/review` accepts a draft up to 2,000 characters and returns a review summary, up to five suggestions ordered by severity, and the remaining allowance. Reviews without suggestions are valid. Drafts and results are returned directly and are not stored.

The Settings card displays the allowance and lets users submit drafts for review. Install `backend/requirements-dev.txt` and run `PYTHONPATH=backend python -m pytest backend/tests` for mocked API checks. The tests prevent dotenv loading while importing the app and mock database and model calls.
