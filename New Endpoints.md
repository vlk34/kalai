# New Api Endpoints

---

### 1. Edit Food Record with AI Context
**POST** `/edit_with_ai`

Re-analyze a food photo with an additional text description to improve accuracy.

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "food_id": "uuid_of_existing_record",
  "text_description": "Grilled chicken breast with mixed vegetables"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Food record updated successfully with improved analysis",
  "data": {
    "food_id": "uuid",
    "text_description": "Grilled chicken breast with mixed vegetables",
    "photo_url": "https://...signedUrl...",
    "original_analysis": { /* previous macros */ },
    "updated_analysis": { /* new macros */ },
    "database_record": { /* full row */ }
  }
}
```

---

### 2. Manually Edit Food Record
**PUT** `/edit_consumed_food`

Update one or more nutrient fields without invoking AI.

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body (any combination of editable fields):**
```json
{
  "food_id": "uuid_of_existing_record",
  "name": "Brown Rice (1 cup)",
  "protein": 5,
  "carbs": 45,
  "fats": 1,
  "calories": 218
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Food record updated successfully",
  "data": {
    "id": "uuid",
    "name": "Brown Rice (1 cup)",
    "protein": 5.0,
    "carbs": 45.0,
    "fats": 1.0,
    "calories": 218.0,
    ...
  }
}
```

---

### 3. Get Daily Nutrition Summary
**GET** `/daily_nutrition_summary`

Get user's daily nutrition summary comparing consumed nutrition with daily goals.

**Authentication:** Required

**Example Request:**
```
GET /daily_nutrition_summary
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Daily nutrition summary retrieved successfully",
  "data": {
    "date": "2024-01-01",
    "consumed_today": {
      "calories": 1245.50,
      "protein": 89.30,
      "carbs": 145.20,
      "fats": 48.75
    },
    "daily_goals": {
      "calories": 2000.0,
      "protein": 150.0,
      "carbs": 200.0,
      "fats": 65.0
    },
    "remaining_to_goal": {
      "calories": 754.50,
      "protein": 60.70,
      "carbs": 54.80,
      "fats": 16.25
    },
    "progress_percentage": {
      "calories": 62.3,
      "protein": 59.5,
      "carbs": 72.6,
      "fats": 75.0
    },
    "foods_consumed_count": 4,
    "goals_status": {
      "calories_exceeded": false,
      "protein_exceeded": false,
      "carbs_exceeded": false,
      "fats_exceeded": false
    }
  }
}
```

**Response Fields:**
- `date`: Today's date in ISO format (YYYY-MM-DD)
- `consumed_today`: Total nutrition consumed today
- `daily_goals`: User's daily nutrition targets from profile
- `remaining_to_goal`: Amount needed to reach goals (negative if exceeded)
- `progress_percentage`: Percentage of each goal achieved
- `foods_consumed_count`: Number of food items consumed today
- `goals_status`: Boolean flags indicating if any goals have been exceeded

**Error Response (404) - Profile Not Found:**
```json
{
  "error": "User profile not found",
  "message": "Please complete your profile setup first"
}
```

**Notes:**
- Only counts foods consumed today (based on server's local date)
- Requires completed user profile with daily nutrition goals
- Remaining values can be negative if goals are exceeded
- Progress percentages are capped at reasonable values for display