# AI credits

`001_ai_credits.sql` adds the subscription, monthly usage and saved meal analysis tables. Apply it to a local Supabase instance before exercising the endpoints. The backend requires a service-role client; the tables are not directly accessible to mobile clients. Subscription plans are provisioned server-side using the canonical values `free` and `pro`.

Free accounts receive 10 shared AI actions per UTC calendar month. Pro accounts have unlimited actions. Photo scans (`POST /consumed`), photo corrections (`POST /edit_with_ai`) and meal descriptions (`POST /ai/analyze`) use the same allowance. `GET /ai/credits` provides the current plan and remaining allowance. Meal descriptions return a nutrition estimate and a saved analysis ID; `GET /ai/analyses/{id}` retrieves an estimate later. Description estimates are separate from the consumed-food diary.

For offline backend checks, install `backend/requirements-dev.txt` in a virtual environment and run `python -m pytest backend/tests` with `PYTHONPATH=backend`. Tests mock database and model calls and prevent dotenv loading while importing the app.
