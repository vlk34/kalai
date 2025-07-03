# API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication

Most endpoints require authentication using Supabase JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_supabase_jwt_token>
```

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 2. Protected Route (Example)
**GET** `/protected`

Example of a protected endpoint.

**Authentication:** Required

**Response:**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com"
  }
}
```

---

### 3. Upload and Analyze Food Photo
**POST** `/consumed`

Upload a food photo for nutritional analysis and save to database.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `photo` (file): Image file (PNG, JPG, JPEG, GIF, WEBP, max 10MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo uploaded, analyzed, and saved successfully",
  "data": {
    "file_info": {
      "original_filename": "food.jpg",
      "unique_filename": "uuid.jpg",
      "file_size": 1024000,
      "file_type": "image/jpeg",
      "user_id": "user_uuid",
              "uploaded_at": "2024-01-01T12:00:00",
        "storage_path": "food-photos/user_uuid/uuid.jpg",
        "photo_url": "https://your-project.supabase.co/storage/v1/object/sign/food-images/food-photos/user_uuid/uuid.jpg?token=signed_token&exp=1234567890"
    },
    "nutritional_analysis": {
      "name": "Grilled Chicken Breast",
      "emoji": "🍗",
      "protein": 31.0,
      "carbs": 0.0,
      "fats": 3.6,
      "calories": 165.0
    },
    "database_record": {
      "id": "record_uuid",
      "user_id": "user_uuid",
      "name": "Grilled Chicken Breast",
      "emoji": "🍗",
      "protein": 31.0,
      "carbs": 0.0,
      "fats": 3.6,
      "calories": 165.0,
      "photo_path": "food-photos/user_uuid/uuid.jpg",
      "created_at": "2024-01-01T12:00:00"
    }
  }
}
```

**Error Responses:**

*400 - No photo provided:*
```json
{
  "error": "No photo file provided",
  "message": "Please upload a photo"
}
```

*400 - Invalid file type:*
```json
{
  "error": "Invalid file type",
  "message": "Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP)"
}
```

*400 - File too large:*
```json
{
  "error": "File too large",
  "message": "Please upload an image smaller than 10MB"
}
```

---

### 4. Get Recently Eaten Foods
**GET** `/recently_eaten`

Get user's recently consumed food items (last 3 by default).

**Authentication:** Required

**Query Parameters:**
- `limit` (optional, integer): Number of items to return (default: 3, max: 100)
- `offset` (optional, integer): Number of items to skip (default: 0)

**Example Request:**
```
GET /recently_eaten?limit=5&offset=0
```

**Success Response (200):**
```json
{
  "foods": [
    {
      "id": "food_uuid",
      "name": "Grilled Chicken Breast",
      "emoji": "🍗",
      "protein": 31.0,
      "carbs": 0.0,
              "fats": 3.6,
        "calories": 165.0,
        "photo_url": "https://your-project.supabase.co/storage/v1/object/sign/food-images/food-photos/user_uuid/uuid.jpg?token=signed_token&exp=1234567890",
        "created_at": "2024-01-01T12:00:00"
    },
    {
      "id": "food_uuid_2",
      "name": "Brown Rice",
      "emoji": "🍚",
      "protein": 5.0,
      "carbs": 45.0,
      "fats": 1.0,
      "calories": 218.0,
      "photo_url": null,
      "created_at": "2024-01-01T11:30:00"
    }
  ]
}
```

**Note:** 
- `photo_url` will be `null` if no photo was uploaded for that food item
- Photo URLs are **signed URLs** that expire after 1 hour for security
- Only the photo owner can access their photos through these URLs
```

**Empty Response (200):**
```json
{
  "success": true,
  "message": "No food records found",
  "data": {
    "foods": [],
    "total_count": 0,
    "user_id": "user_uuid"
  }
}
```

---

### 5. Get Full Food History
**GET** `/full_history`

Get user's complete food consumption history with pagination.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional, integer): Number of items to return (default: 20, max: 100)
- `offset` (optional, integer): Number of items to skip (default: 0)

**Example Request:**
```
GET /full_history?limit=10&offset=20
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Retrieved 10 recent food items",
  "data": {
    "foods": [
      {
        "id": "food_uuid",
        "name": "Grilled Chicken Breast",
        "emoji": "🍗",
        "protein": 31.0,
        "carbs": 0.0,
        "fats": 3.6,
        "calories": 165.0,
        "photo_url": "https://your-project.supabase.co/storage/v1/object/sign/food-images/food-photos/user_uuid/uuid.jpg?token=signed_token&exp=1234567890",
        "created_at": "2024-01-01T12:00:00"
      }
    ],
    "daily_totals": {
      "calories": 1850.5,
      "protein": 125.3,
      "carbs": 200.1,
      "fats": 65.8
    },
    "pagination": {
      "limit": 10,
      "offset": 20,
      "count": 10
    },
    "user_id": "user_uuid"
  }
}
```

---

### 6. Get Daily Nutrition Summary
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

---

## Frontend Integration Examples

### JavaScript/Fetch Example

```javascript
// 1. Upload food photo
const uploadFoodPhoto = async (photoFile, token) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  
  const response = await fetch('http://localhost:5000/consumed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};

// 2. Get recent foods
const getRecentFoods = async (token, limit = 3) => {
  const response = await fetch(`http://localhost:5000/recently_eaten?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 3. Get full history with pagination
const getFoodHistory = async (token, limit = 20, offset = 0) => {
  const response = await fetch(
    `http://localhost:5000/full_history?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
};

// 4. Get daily nutrition summary
const getDailyNutritionSummary = async (token) => {
  const response = await fetch('http://localhost:5000/daily_nutrition_summary', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### React Example

```jsx
import { useState, useEffect } from 'react';

const FoodTracker = ({ supabaseToken }) => {
  const [recentFoods, setRecentFoods] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Load recent foods on component mount
  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    try {
      const response = await fetch('http://localhost:5000/recently_eaten', {
        headers: {
          'Authorization': `Bearer ${supabaseToken}`
        }
      });
      const data = await response.json();
      setRecentFoods(data.foods || []);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('http://localhost:5000/consumed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseToken}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Refresh recent foods after successful upload
        loadRecentFoods();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handlePhotoUpload}
        disabled={uploading}
      />
      
      <div>
        <h3>Recent Foods:</h3>
        {recentFoods.map(food => (
          <div key={food.id} style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
            {food.photo_url && (
              <img 
                src={food.photo_url} 
                alt={food.name}
                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span>{food.emoji} {food.name} - {food.calories} cal</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Error Handling

All endpoints may return these common error responses:

**401 - Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**500 - Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5500`
- `http://localhost:5500`

## Notes for Frontend Developers

1. **File Upload**: Use `FormData` for the `/consumed` endpoint
2. **Authentication**: Always include the Supabase JWT token in the Authorization header
3. **Image Formats**: Supported formats are PNG, JPG, JPEG, GIF, WEBP
4. **File Size**: Maximum upload size is 10MB
5. **Pagination**: Use `limit` and `offset` parameters for paginated endpoints
6. **Error Handling**: Always check the response status and handle error cases appropriately 