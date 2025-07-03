# Simplified Onboarding Setup - Python Only

This guide sets up the user onboarding system using **Python-only calculations** without SQL duplication.

## 🗄️ Database Setup

### Run Clean Setup Script

Execute this in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of clean_database_setup.sql
-- This removes all duplicate SQL functions and creates a clean schema
```

**What this does:**
- ✅ Removes all duplicate SQL calculation functions
- ✅ Drops problematic triggers that caused conflicts
- ✅ Creates clean `user_profiles` table structure
- ✅ Sets up proper RLS policies
- ✅ Keeps only essential `updated_at` trigger

### Verify Setup

Run this query to verify your table structure:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 🔐 Environment Configuration

Same as before - update your `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
FLASK_ENV=development
FLASK_DEBUG=True
```

## 🚀 Benefits of This Approach

### ✅ Advantages
- **No Code Duplication** - Single source of truth in Python
- **No Trigger Conflicts** - Python handles all calculations
- **Easier Testing** - Test calculations in Python unit tests
- **Better Error Handling** - Detailed error messages from Python
- **Simpler Database** - Clean schema without complex functions

### 📋 API Endpoints

**All calculations happen in Python:**

1. **POST `/calculate-targets`** - Preview targets (no auth)
   - Uses `NutritionCalculator.calculate_daily_targets()`
   
2. **POST `/user_profiles`** - Create/update profile
   - Calculates targets in Python
   - Saves complete profile with pre-calculated targets
   
3. **GET `/user_profiles`** - Get profile 
   - Returns stored targets (no recalculation needed)
   
4. **POST `/recalculate`** - Manually recalculate targets
   - Fetches profile, recalculates in Python, updates database

## 🧪 Testing

Your existing test script should now work perfectly:

```bash
cd backend
python test_onboarding_api.py
```

Expected results:
- ✅ Health check passes
- ✅ Target preview works (no auth)
- ✅ Profile creation succeeds (with auth)
- ✅ Profile retrieval works
- ✅ Target recalculation works

## 🔄 Migration from Old Setup

If you were using the old SQL functions:

1. **Run `clean_database_setup.sql`** - This safely removes old functions
2. **Test your application** - Everything should work immediately
3. **Delete old files** - You can now delete `daily_targets_calculator.sql`

## 📁 File Structure

**Keep these files:**
- ✅ `user_profiles_table.sql` → Use for reference, but `clean_database_setup.sql` is better
- ✅ `backend/src/utils/nutrition_calculator.py` → Your main calculation logic
- ✅ `backend/src/routes/user_profiles.py` → API endpoints
- ✅ `test_onboarding_api.py` → Testing

**Can delete:**
- ❌ `daily_targets_calculator.sql` → No longer needed
- ❌ `fix_trigger.sql` → No longer needed

## 🚨 Troubleshooting

### "Function does not exist" errors
- Run `clean_database_setup.sql` to remove old functions
- Restart your Flask app

### "Trigger conflicts"
- The clean setup removes all problematic triggers
- Only keeps simple `updated_at` trigger

### Calculation errors
- All errors now come from Python with detailed messages
- Check `nutrition_calculator.py` for logic issues

## 🎯 Next Steps

1. **Frontend Integration** - Connect your UI to these simplified APIs
2. **Unit Tests** - Add tests for `NutritionCalculator` class  
3. **Profile Updates** - Users can modify settings and targets recalculate
4. **Progress Tracking** - Compare daily intake vs stored targets

Your system is now **much simpler** and **more maintainable**! 🎉 