-- Create user_profiles table for onboarding data
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Step 1: Gender
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    
    -- Step 2: Activity Level  
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'lightly_active', 'very_active')),
    
    -- Step 3: Tracking Difficulty
    tracking_difficulty VARCHAR(15) CHECK (tracking_difficulty IN ('challenging', 'manageable', 'easy')),
    
    -- Step 4: Experience Level
    experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'some_experience', 'very_experienced')),
    
    -- Step 5: Height & Weight with units
    height_unit VARCHAR(10) CHECK (height_unit IN ('metric', 'imperial')),
    height_value DECIMAL(5,2),     -- e.g., 175.50 cm or 5.90 ft
    height_inches INTEGER,         -- additional inches for imperial (when using ft)
    weight_unit VARCHAR(10) CHECK (weight_unit IN ('metric', 'imperial')),
    weight_value DECIMAL(6,2),     -- e.g., 70.50 kg or 155.20 lbs
    
    -- Step 6: Date of Birth
    date_of_birth DATE,
    
    -- Step 7: Main Goal
    main_goal VARCHAR(15) CHECK (main_goal IN ('lose_weight', 'maintain_weight', 'gain_weight', 'build_muscle')),
    
    -- Step 8: Dietary Preferences
    dietary_preference VARCHAR(20) CHECK (dietary_preference IN ('no_restrictions', 'vegetarian', 'vegan', 'keto')),
    
    -- Step 9: Calculated daily targets
    daily_calories INTEGER,
    daily_protein_g DECIMAL(6,2),
    daily_carbs_g DECIMAL(6,2),
    daily_fats_g DECIMAL(6,2),
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for better query performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Create an index on onboarding_completed for filtering
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);

-- Create an index on created_at for chronological queries
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy so users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id); 