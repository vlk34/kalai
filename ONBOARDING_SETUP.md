# Complete Onboarding Setup Guide

This guide will walk you through setting up the complete user onboarding experience for your nutrition tracking app.

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Create Tables

Execute these SQL files in your Supabase SQL Editor in order:

#### **Run `user_profiles_table.sql`**
```sql
-- Copy and paste the contents of user_profiles_table.sql
-- This creates the user_profiles table with all onboarding fields
```

#### **Run `daily_targets_calculator.sql`**
```sql
-- Copy and paste the contents of daily_targets_calculator.sql
-- This creates calculation functions and triggers
```

#### **Run `foods_consumed_table.sql` (if not already done)**
```sql
-- Copy and paste the contents of foods_consumed_table.sql
-- This creates the foods_consumed table for tracking meals
```

### 1.2 Verify Tables Created
Run this query to check your tables:
```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'foods_consumed');
```

You should see:
- `user_profiles`
- `foods_consumed`

## 🔐 Step 2: Environment Configuration

### 2.1 Update `.env` file
Create or update your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### 2.2 Get Supabase Credentials

1. Go to your Supabase dashboard
2. Navigate to **Settings > API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## 🚀 Step 3: Start Your Backend

### 3.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3.2 Run the Flask App
```bash
python app.py
```

Your API should be running at: `http://localhost:5000`

### 3.3 Test Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "healthy"}
```

## 🧪 Step 4: Test Authentication

### 4.1 Create Test User

Open `backend/test_auth.html` in your browser and:

1. **Update Supabase credentials** in the script section:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co'
   const SUPABASE_ANON_KEY = 'your_anon_key_here'
   ```

2. **Create a test account:**
   - Enter email and password
   - Click "Sign Up"
   - Check your email for verification link
   - Click verification link
   - Return to test page and "Sign In"

3. **Test Protected Route:**
   - Click "Test Protected Route"
   - Should return user info if authenticated

## 📋 Step 5: Test Complete Onboarding Flow

### 5.1 Test Profile Creation (POST /api/profiles/)

Use the test page or curl:

```bash
curl -X POST http://localhost:5000/api/profiles/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "male",
    "activity_level": "lightly_active",
    "tracking_difficulty": "manageable",
    "experience_level": "some_experience",
    "height_unit": "metric",
    "height_value": 180,
    "weight_unit": "metric",
    "weight_value": 75,
    "date_of_birth": "1990-05-15",
    "main_goal": "build_muscle",
    "dietary_preference": "no_restrictions"
  }'
```

**Expected Response:**
```json
{
  "message": "Profile created successfully",
  "profile": {
    "id": "uuid",
    "user_id": "user_uuid",
    "gender": "male",
    "daily_calories": 2650,
    "daily_protein_g": 165.0,
    "daily_carbs_g": 331.2,
    "daily_fats_g": 73.6,
    "onboarding_completed": true
  },
  "daily_targets": {
    "calories": 2650,
    "protein_g": 165.0,
    "carbs_g": 331.2,
    "fats_g": 73.6
  }
}
```

### 5.2 Test Profile Retrieval (GET /api/profiles/)

```bash
curl -X GET http://localhost:5000/api/profiles/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.3 Test Target Calculation Preview (POST /api/profiles/calculate-targets)

```bash
curl -X POST http://localhost:5000/api/profiles/calculate-targets \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "female",
    "activity_level": "very_active",
    "height_unit": "imperial",
    "height_value": 5,
    "height_inches": 6,
    "weight_unit": "imperial",
    "weight_value": 140,
    "date_of_birth": "1995-03-20",
    "main_goal": "lose_weight",
    "dietary_preference": "vegetarian"
  }'
```

## 🎨 Step 6: Frontend Integration

### 6.1 JavaScript/React Integration

```javascript
// 1. Get Supabase session
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'your-supabase-url',
  'your-anon-key'
)

// 2. Helper to get JWT token
const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

// 3. Complete onboarding
const completeOnboarding = async (onboardingData) => {
  const token = await getToken()
  
  const response = await fetch('http://localhost:5000/api/profiles/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(onboardingData)
  })
  
  return await response.json()
}

// 4. Get user profile
const getUserProfile = async () => {
  const token = await getToken()
  
  const response = await fetch('http://localhost:5000/api/profiles/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// 5. Preview targets during onboarding
const previewTargets = async (formData) => {
  const response = await fetch('http://localhost:5000/api/profiles/calculate-targets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  
  return await response.json()
}
```

### 6.2 React Component Example

```jsx
import { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [previewTargets, setPreviewTargets] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const supabase = useSupabaseClient()
  const user = useUser()

  // Preview targets on step 9
  const updatePreview = async () => {
    if (currentStep === 9 && isFormComplete()) {
      try {
        const response = await fetch('http://localhost:5000/api/profiles/calculate-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        const result = await response.json()
        setPreviewTargets(result.daily_targets)
      } catch (error) {
        console.error('Failed to preview targets:', error)
      }
    }
  }

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('http://localhost:5000/api/profiles/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Redirect to main app
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Onboarding failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-container">
      {currentStep === 1 && (
        <GenderStep 
          value={formData.gender}
          onChange={(gender) => setFormData({...formData, gender})}
          onNext={() => setCurrentStep(2)}
        />
      )}
      
      {currentStep === 9 && (
        <SummaryStep
          targets={previewTargets}
          onComplete={completeOnboarding}
          loading={loading}
        />
      )}
    </div>
  )
}
```

## 🔄 Step 7: Complete User Flow

### 7.1 Onboarding Journey
1. **User signs up/in** → Supabase handles authentication
2. **Steps 1-8** → Frontend collects data, optionally previews targets
3. **Step 9** → Show calculated targets, user confirms
4. **Submit** → POST to `/api/profiles/` saves everything
5. **Redirect** → User goes to main app with profile completed

### 7.2 Returning User Flow
1. **User logs in** → Check if profile exists
2. **GET `/api/profiles/`** → Fetch profile and targets
3. **If 404** → Redirect to onboarding
4. **If found** → Show dashboard with daily targets

### 7.3 Profile Updates
1. **Settings page** → User can update goals, weight, etc.
2. **PUT `/api/profiles/`** → Update profile (triggers recalculation)
3. **POST `/api/profiles/recalculate`** → Manually recalculate targets

## 🧪 Step 8: Testing Checklist

- [ ] ✅ Supabase tables created
- [ ] ✅ Environment variables set
- [ ] ✅ Flask app starts successfully
- [ ] ✅ Health check responds
- [ ] ✅ User authentication works
- [ ] ✅ Profile creation succeeds
- [ ] ✅ Profile retrieval works
- [ ] ✅ Target calculation works
- [ ] ✅ RLS policies prevent unauthorized access
- [ ] ✅ Frontend can authenticate users
- [ ] ✅ Frontend can complete onboarding
- [ ] ✅ End-to-end user flow works

## 🚨 Troubleshooting

### Common Issues:

**1. "Table 'user_profiles' doesn't exist"**
- Run the SQL migrations in Supabase SQL Editor
- Check table was created: `SELECT * FROM user_profiles LIMIT 1;`

**2. "JWT verification failed"**
- Check `SUPABASE_JWT_SECRET` in `.env`
- Ensure token hasn't expired
- Test with fresh sign-in

**3. "RLS policy violation"**
- User must be authenticated
- Check `auth.uid()` matches `user_id` in policies
- Test with Supabase dashboard

**4. "Missing required fields"**
- Check frontend is sending all required onboarding fields
- Validate date format (YYYY-MM-DD)

**5. "CORS errors"**
- Check Flask CORS configuration in `app.py`
- Ensure frontend origin is in allowed origins list

## 📱 Next Steps

After setup is complete:

1. **Build Frontend Onboarding UI** → 9-step wizard matching your design
2. **Add Photo Upload** → Integrate with existing `/consumed` endpoint
3. **Dashboard Integration** → Show daily targets and progress
4. **Profile Settings** → Allow users to update their information
5. **Progress Tracking** → Compare daily intake vs targets

Your complete onboarding system is now ready! 🎉 