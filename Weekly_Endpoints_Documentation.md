# Weekly Endpoints Documentation

This document provides detailed information about the weekly food tracking endpoints that return data for the last 5 days.

## Table of Contents
- [Authentication](#authentication)
- [Weekly Recently Eaten](#weekly-recently-eaten)
- [Weekly Daily Nutrition Summary](#weekly-daily-nutrition-summary)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

## Authentication

Both endpoints require Supabase token authentication. Include the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

## Weekly Recently Eaten

**Endpoint:** `GET /weekly_recently_eaten`

**Description:** Retrieves recently consumed food items for the last 5 days (including today), organized by date.

### Parameters

| Parameter | Type | Required | Default | Max | Description |
|-----------|------|----------|---------|-----|-------------|
| `daily_limit` | integer | No | 3 | 20 | Number of food items to return per day |

### Example Request

```bash
GET /weekly_recently_eaten?daily_limit=5
Authorization: Bearer <token>
```

### Response Structure

```json
{
  "success": true,
  "message": "Retrieved recent food items for the last 5 days",
  "data": {
    "weekly_foods": {
      "2024-01-15": {
        "foods": [
          {
            "id": "uuid",
            "name": "Grilled Chicken Breast",
            "emoji": "🍗",
            "protein": 31.0,
            "carbs": 0.0,
            "fats": 3.6,
            "calories": 165.0,
            "portion": 1.0,
            "photo_url": "https://signed-url.com/image.jpg",
            "created_at": "2024-01-15T14:30:00Z"
          }
        ],
        "count": 1,
        "daily_totals": {
          "calories": 165.0,
          "protein": 31.0,
          "carbs": 0.0,
          "fats": 3.6
        }
      },
      "2024-01-14": {
        "foods": [],
        "count": 0,
        "daily_totals": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fats": 0.0
        }
      }
    },
    "user_id": "user-uuid",
    "date_range": {
      "start_date": "2024-01-11",
      "end_date": "2024-01-15"
    }
  }
}
```

### Food Item Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier for the food entry |
| `name` | string | Name of the food item |
| `emoji` | string | Emoji representation of the food |
| `protein` | number | Protein content in grams |
| `carbs` | number | Carbohydrate content in grams |
| `fats` | number | Fat content in grams |
| `calories` | number | Caloric content |
| `portion` | number | Portion size multiplier |
| `photo_url` | string/null | Signed URL for food photo (1-hour expiry) |
| `created_at` | string | ISO timestamp of when food was logged |

## Weekly Daily Nutrition Summary

**Endpoint:** `GET /weekly_daily_nutrition_summary`

**Description:** Provides daily nutrition summaries for the last 5 days, comparing consumed nutrition against user's daily goals.

### Parameters

No parameters required.

### Example Request

```bash
GET /weekly_daily_nutrition_summary
Authorization: Bearer <token>
```

### Response Structure

```json
{
  "success": true,
  "message": "Weekly nutrition summary retrieved successfully",
  "data": {
    "weekly_nutrition": {
      "2024-01-15": {
        "consumed_today": {
          "calories": 1847.5,
          "protein": 125.3,
          "carbs": 180.2,
          "fats": 65.8
        },
        "remaining_to_goal": {
          "calories": 152.5,
          "protein": -5.3,
          "carbs": 69.8,
          "fats": 14.2
        },
        "progress_percentage": {
          "calories": 92.4,
          "protein": 104.4,
          "carbs": 72.1,
          "fats": 82.3
        },
        "foods_consumed_count": 8,
        "goals_status": {
          "calories_exceeded": false,
          "protein_exceeded": true,
          "carbs_exceeded": false,
          "fats_exceeded": false
        }
      },
      "2024-01-14": {
        "consumed_today": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fats": 0.0
        },
        "remaining_to_goal": {
          "calories": 2000.0,
          "protein": 120.0,
          "carbs": 250.0,
          "fats": 80.0
        },
        "progress_percentage": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fats": 0.0
        },
        "foods_consumed_count": 0,
        "goals_status": {
          "calories_exceeded": false,
          "protein_exceeded": false,
          "carbs_exceeded": false,
          "fats_exceeded": false
        }
      }
    },
    "daily_goals": {
      "calories": 2000.0,
      "protein": 120.0,
      "carbs": 250.0,
      "fats": 80.0
    },
    "user_id": "user-uuid",
    "date_range": {
      "start_date": "2024-01-11",
      "end_date": "2024-01-15"
    }
  }
}
```

### Daily Nutrition Properties

| Section | Property | Type | Description |
|---------|----------|------|-------------|
| `consumed_today` | calories/protein/carbs/fats | number | Total nutrition consumed for the day |
| `remaining_to_goal` | calories/protein/carbs/fats | number | Amount remaining to reach daily goals (negative if exceeded) |
| `progress_percentage` | calories/protein/carbs/fats | number | Percentage of daily goal achieved (0-100+) |
| `goals_status` | *_exceeded | boolean | Whether each macro goal was exceeded |
| - | foods_consumed_count | number | Total number of food items logged that day |

## Response Format

Both endpoints follow a consistent response format:

### Success Response
```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {
    // Endpoint-specific data
  }
}
```

### Common Data Properties
| Property | Type | Description |
|----------|------|-------------|
| `user_id` | string | UUID of the authenticated user |
| `date_range.start_date` | string | Start date of the 5-day range (ISO format) |
| `date_range.end_date` | string | End date of the 5-day range (ISO format) |

## Error Handling

### Common Error Responses

#### Authentication Error (401)
```json
{
  "error": "Authentication failed",
  "message": "Invalid or missing token"
}
```

#### User Profile Not Found (404)
```json
{
  "error": "User profile not found",
  "message": "Please complete your profile setup first"
}
```

#### Server Error (500)
```json
{
  "error": "Failed to fetch weekly food records",
  "message": "Detailed error message"
}
```

### Parameter Validation

#### Invalid daily_limit (weekly_recently_eaten)
- Maximum `daily_limit` is automatically capped at 20
- Minimum `daily_limit` defaults to 1 if provided value is invalid

## Data Organization

### Date Keys
- Data is organized by date in ISO format: `YYYY-MM-DD`
- Dates are ordered from most recent (today) to 5 days ago
- Each date key contains complete data for that 24-hour period

### Time Zones
- All dates are processed in the server's local timezone
- `created_at` timestamps are returned in ISO format with timezone information

### Photo URLs
- Food photos return signed URLs with 1-hour expiry
- URLs may be `null` if no photo was uploaded
- Failed photo URL generation is logged but doesn't fail the request

## Usage Examples

### Get last 3 foods per day for the week
```bash
curl -X GET "https://api.example.com/weekly_recently_eaten" \
  -H "Authorization: Bearer <token>"
```

### Get last 10 foods per day for the week
```bash
curl -X GET "https://api.example.com/weekly_recently_eaten?daily_limit=10" \
  -H "Authorization: Bearer <token>"
```

### Get weekly nutrition summary
```bash
curl -X GET "https://api.example.com/weekly_daily_nutrition_summary" \
  -H "Authorization: Bearer <token>"
```

## Notes

- Both endpoints require the user to have a complete profile with daily nutrition goals set
- Nutritional values are stored with portion adjustments already applied
- The 5-day range includes today and the previous 4 days
- Empty days (no food logged) are included in the response with zero values
- Photo URLs are generated on-demand and have a 1-hour expiry for security 