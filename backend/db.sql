-- Kal AI Database Schema for Supabase
-- This schema supports the complete nutrition tracking app functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth, but we'll reference it)
-- Note: Supabase automatically creates auth.users table
-- We'll create a profiles table to extend user data

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User onboarding/preferences data
CREATE TABLE user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Onboarding data
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    activity_level TEXT CHECK (activity_level IN ('low', 'moderate', 'high')),
    tracking_difficulty TEXT CHECK (tracking_difficulty IN ('yes', 'sometimes', 'no')),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
    primary_goal TEXT CHECK (primary_goal IN ('lose', 'maintain', 'gain', 'muscle')),
    diet_preference TEXT CHECK (diet_preference IN ('none', 'vegetarian', 'vegan', 'keto', 'paleo')),
    
    -- Calculated daily targets
    daily_calories INTEGER,
    daily_protein_g INTEGER,
    daily_carbs_g INTEGER,
    daily_fats_g INTEGER,
    
    -- App preferences
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    notifications_enabled BOOLEAN DEFAULT true,
    reminder_times JSONB, -- Array of reminder times
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food database bence buna ihtiyac yok
CREATE TABLE foods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT UNIQUE,
    
    -- Nutrition per 100g
    calories_per_100g DECIMAL(8,2) NOT NULL,
    protein_per_100g DECIMAL(8,2) DEFAULT 0,
    carbs_per_100g DECIMAL(8,2) DEFAULT 0,
    fats_per_100g DECIMAL(8,2) DEFAULT 0,
    fiber_per_100g DECIMAL(8,2) DEFAULT 0,
    sugar_per_100g DECIMAL(8,2) DEFAULT 0,
    sodium_per_100g DECIMAL(8,2) DEFAULT 0,
    
    -- Additional info
    category TEXT, -- e.g., 'fruits', 'vegetables', 'grains', etc.
    verified BOOLEAN DEFAULT false, -- Admin verified
    source TEXT, -- 'user_added', 'database', 'api'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's daily nutrition logs
CREATE TABLE daily_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    
    -- Daily totals (calculated from meals)
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein DECIMAL(8,2) DEFAULT 0,
    total_carbs DECIMAL(8,2) DEFAULT 0,
    total_fats DECIMAL(8,2) DEFAULT 0,
    total_fiber DECIMAL(8,2) DEFAULT 0,
    
    -- Daily targets (copied from user_preferences for historical tracking)
    target_calories INTEGER,
    target_protein INTEGER,
    target_carbs INTEGER,
    target_fats INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, log_date)
);

-- Individual meals/food entries
CREATE TABLE meal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE NOT NULL,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    
    -- Meal details
    meal_name TEXT, -- Custom name if not from foods table
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    portion_size_g DECIMAL(8,2) NOT NULL,
    
    -- Calculated nutrition for this portion
    calories DECIMAL(8,2) NOT NULL,
    protein DECIMAL(8,2) DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    fats DECIMAL(8,2) DEFAULT 0,
    fiber DECIMAL(8,2) DEFAULT 0,
    
    -- AI analysis data
    image_url TEXT, -- Stored image URL
    ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
    ai_analysis_data JSONB, -- Raw AI response data
    
    -- Timing
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight tracking
CREATE TABLE weight_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    log_date DATE NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, log_date)
);

-- Streak tracking
CREATE TABLE user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_log_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User achievements/badges - ihtiyac yok
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    criteria JSONB, -- Achievement criteria
    category TEXT, -- 'streak', 'weight', 'nutrition', etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned achievements - ihtiyac yok
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- AI analysis cache (to avoid re-analyzing same images)
CREATE TABLE ai_analysis_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_hash TEXT UNIQUE NOT NULL, -- Hash of the image
    analysis_result JSONB NOT NULL,
    confidence DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback on AI predictions (for improving accuracy) - bilmiyorum
CREATE TABLE ai_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    meal_entry_id UUID REFERENCES meal_entries(id) ON DELETE CASCADE NOT NULL,
    
    original_prediction JSONB, -- What AI predicted
    user_correction JSONB, -- What user corrected it to
    feedback_type TEXT CHECK (feedback_type IN ('portion_size', 'food_type', 'nutrition_values')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition goals history (track changes over time)
CREATE TABLE goal_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Goal values
    target_weight_kg DECIMAL(5,2),
    daily_calories INTEGER,
    daily_protein INTEGER,
    daily_carbs INTEGER,
    daily_fats INTEGER,
    
    -- Goal period
    start_date DATE NOT NULL,
    end_date DATE,
    goal_type TEXT, -- 'weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App usage analytics (optional - for improving UX)
CREATE TABLE usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- 'app_open', 'photo_taken', 'manual_entry', etc.
    event_data JSONB,
    session_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX idx_meal_entries_user_date ON meal_entries(user_id, consumed_at);
CREATE INDEX idx_meal_entries_daily_log ON meal_entries(daily_log_id);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_barcode ON foods(barcode);
CREATE INDEX idx_ai_analysis_cache_hash ON ai_analysis_cache(image_hash);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meal entries" ON meal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weight logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON user_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own feedback" ON ai_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goal_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own analytics" ON usage_analytics FOR ALL USING (auth.uid() = user_id);

-- Public read access for foods and achievements
CREATE POLICY "Anyone can read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_entries_updated_at BEFORE UPDATE ON meal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate daily totals when meal entries change
CREATE OR REPLACE FUNCTION update_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily_logs totals when meal_entries are inserted/updated/deleted
    UPDATE daily_logs 
    SET 
        total_calories = (
            SELECT COALESCE(SUM(calories), 0) 
            FROM meal_entries 
            WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
        ),
        total_protein = (
            SELECT COALESCE(SUM(protein), 0) 
            FROM meal_entries 
            WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
        ),
        total_carbs = (
            SELECT COALESCE(SUM(carbs), 0) 
            FROM meal_entries 
            WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
        ),
        total_fats = (
            SELECT COALESCE(SUM(fats), 0) 
            FROM meal_entries 
            WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
        ),
        total_fiber = (
            SELECT COALESCE(SUM(fiber), 0) 
            FROM meal_entries 
            WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.daily_log_id, OLD.daily_log_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger for automatic daily totals calculation
CREATE TRIGGER update_daily_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON meal_entries
    FOR EACH ROW EXECUTE FUNCTION update_daily_totals();

-- Insert some sample achievements
INSERT INTO achievements (name, description, icon, criteria, category) VALUES
('First Step', 'Log your first meal', '🎯', '{"meals_logged": 1}', 'nutrition'),
('Week Warrior', 'Log meals for 7 consecutive days', '🔥', '{"consecutive_days": 7}', 'streak'),
('Month Master', 'Log meals for 30 consecutive days', '👑', '{"consecutive_days": 30}', 'streak'),
('Photo Pro', 'Use camera to log 10 meals', '📸', '{"photo_meals": 10}', 'nutrition'),
('Goal Getter', 'Meet your daily calorie goal 5 times', '🎯', '{"goal_days": 5}', 'nutrition'),
('Weight Tracker', 'Log your weight 10 times', '⚖️', '{"weight_logs": 10}', 'weight'),
('Protein Power', 'Meet your protein goal 10 times', '💪', '{"protein_goal_days": 10}', 'nutrition');

-- Sample foods (you would populate this with a comprehensive food database)
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, category, verified, source) VALUES
('Banana', 89, 1.1, 22.8, 0.3, 'fruits', true, 'database'),
('Chicken Breast (Raw)', 165, 31, 0, 3.6, 'meat', true, 'database'),
('Brown Rice (Cooked)', 123, 2.6, 23, 0.9, 'grains', true, 'database'),
('Avocado', 160, 2, 8.5, 14.7, 'fruits', true, 'database'),
('Broccoli', 34, 2.8, 7, 0.4, 'vegetables', true, 'database'),
('Salmon (Raw)', 208, 20, 0, 13, 'fish', true, 'database'),
('Greek Yogurt (Plain)', 59, 10, 3.6, 0.4, 'dairy', true, 'database'),
('Almonds', 579, 21, 22, 50, 'nuts', true, 'database');
