-- Daily Targets Calculator Functions for Supabase
-- These functions calculate BMR, daily calories, and macronutrient targets

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(date_of_birth DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth));
END;
$$ LANGUAGE plpgsql;

-- Function to convert imperial measurements to metric
CREATE OR REPLACE FUNCTION convert_to_metric(
    height_unit VARCHAR,
    height_value DECIMAL,
    height_inches INTEGER,
    weight_unit VARCHAR,
    weight_value DECIMAL
)
RETURNS TABLE(height_cm DECIMAL, weight_kg DECIMAL) AS $$
BEGIN
    IF height_unit = 'imperial' THEN
        -- Convert feet + inches to cm
        height_cm := (height_value * 12 + COALESCE(height_inches, 0)) * 2.54;
    ELSE
        height_cm := height_value;
    END IF;
    
    IF weight_unit = 'imperial' THEN
        -- Convert lbs to kg
        weight_kg := weight_value * 0.453592;
    ELSE
        weight_kg := weight_value;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate BMR using Mifflin-St Jeor Equation
CREATE OR REPLACE FUNCTION calculate_bmr(
    gender VARCHAR,
    weight_kg DECIMAL,
    height_cm DECIMAL,
    age INTEGER
)
RETURNS DECIMAL AS $$
BEGIN
    IF gender = 'male' THEN
        -- BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
        RETURN 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    ELSE
        -- BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
        RETURN 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get activity multiplier
CREATE OR REPLACE FUNCTION get_activity_multiplier(activity_level VARCHAR)
RETURNS DECIMAL AS $$
BEGIN
    CASE activity_level
        WHEN 'sedentary' THEN RETURN 1.2;
        WHEN 'lightly_active' THEN RETURN 1.375;
        WHEN 'very_active' THEN RETURN 1.725;
        ELSE RETURN 1.2; -- Default to sedentary
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to adjust calories based on goal
CREATE OR REPLACE FUNCTION adjust_calories_for_goal(
    maintenance_calories DECIMAL,
    main_goal VARCHAR
)
RETURNS DECIMAL AS $$
BEGIN
    CASE main_goal
        WHEN 'lose_weight' THEN RETURN maintenance_calories * 0.8; -- 20% deficit
        WHEN 'maintain_weight' THEN RETURN maintenance_calories;
        WHEN 'gain_weight' THEN RETURN maintenance_calories * 1.15; -- 15% surplus
        WHEN 'build_muscle' THEN RETURN maintenance_calories * 1.1; -- 10% surplus
        ELSE RETURN maintenance_calories;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate macronutrient distribution
CREATE OR REPLACE FUNCTION calculate_macros(
    daily_calories DECIMAL,
    main_goal VARCHAR,
    dietary_preference VARCHAR,
    weight_kg DECIMAL
)
RETURNS TABLE(protein_g DECIMAL, carbs_g DECIMAL, fats_g DECIMAL) AS $$
DECLARE
    protein_ratio DECIMAL;
    fat_ratio DECIMAL;
    carb_ratio DECIMAL;
    min_protein_g DECIMAL;
BEGIN
    -- Base protein on body weight and goal
    CASE main_goal
        WHEN 'build_muscle' THEN min_protein_g := weight_kg * 2.2; -- 2.2g per kg
        WHEN 'lose_weight' THEN min_protein_g := weight_kg * 2.0;  -- 2.0g per kg
        ELSE min_protein_g := weight_kg * 1.6; -- 1.6g per kg for maintenance/gain
    END CASE;
    
    -- Adjust for dietary preferences
    CASE dietary_preference
        WHEN 'keto' THEN
            protein_ratio := 0.25;
            fat_ratio := 0.70;
            carb_ratio := 0.05;
        WHEN 'vegan' THEN
            protein_ratio := 0.15;
            fat_ratio := 0.25;
            carb_ratio := 0.60;
        WHEN 'vegetarian' THEN
            protein_ratio := 0.20;
            fat_ratio := 0.30;
            carb_ratio := 0.50;
        ELSE -- no_restrictions
            protein_ratio := 0.25;
            fat_ratio := 0.25;
            carb_ratio := 0.50;
    END CASE;
    
    -- Calculate macros
    protein_g := GREATEST(min_protein_g, daily_calories * protein_ratio / 4); -- 4 cal per g
    fats_g := daily_calories * fat_ratio / 9; -- 9 cal per g
    carbs_g := (daily_calories - (protein_g * 4) - (fats_g * 9)) / 4; -- remaining calories
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Main function to calculate all daily targets
CREATE OR REPLACE FUNCTION calculate_daily_targets(profile_id UUID)
RETURNS TABLE(
    calories INTEGER,
    protein_g DECIMAL,
    carbs_g DECIMAL,
    fats_g DECIMAL
) AS $$
DECLARE
    profile_record user_profiles%ROWTYPE;
    user_age INTEGER;
    height_cm DECIMAL;
    weight_kg DECIMAL;
    bmr DECIMAL;
    maintenance_calories DECIMAL;
    daily_calories DECIMAL;
    macros RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO profile_record FROM user_profiles WHERE id = profile_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;
    
    -- Calculate age
    user_age := calculate_age(profile_record.date_of_birth);
    
    -- Convert measurements to metric
    SELECT * INTO height_cm, weight_kg FROM convert_to_metric(
        profile_record.height_unit,
        profile_record.height_value,
        profile_record.height_inches,
        profile_record.weight_unit,
        profile_record.weight_value
    );
    
    -- Calculate BMR
    bmr := calculate_bmr(profile_record.gender, weight_kg, height_cm, user_age);
    
    -- Calculate maintenance calories
    maintenance_calories := bmr * get_activity_multiplier(profile_record.activity_level);
    
    -- Adjust for goal
    daily_calories := adjust_calories_for_goal(maintenance_calories, profile_record.main_goal);
    
    -- Calculate macros
    SELECT * INTO macros FROM calculate_macros(
        daily_calories,
        profile_record.main_goal,
        profile_record.dietary_preference,
        weight_kg
    );
    
    -- Return results
    calories := ROUND(daily_calories)::INTEGER;
    protein_g := ROUND(macros.protein_g, 1);
    carbs_g := ROUND(macros.carbs_g, 1);
    fats_g := ROUND(macros.fats_g, 1);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically calculate targets when profile is updated
CREATE OR REPLACE FUNCTION update_daily_targets()
RETURNS TRIGGER AS $$
DECLARE
    targets RECORD;
BEGIN
    -- Only calculate if we have all required data
    IF NEW.gender IS NOT NULL 
       AND NEW.activity_level IS NOT NULL 
       AND NEW.height_value IS NOT NULL 
       AND NEW.weight_value IS NOT NULL 
       AND NEW.date_of_birth IS NOT NULL 
       AND NEW.main_goal IS NOT NULL 
       AND NEW.dietary_preference IS NOT NULL THEN
        
        -- Calculate daily targets
        SELECT * INTO targets FROM calculate_daily_targets(NEW.id);
        
        -- Update the record
        NEW.daily_calories := targets.calories;
        NEW.daily_protein_g := targets.protein_g;
        NEW.daily_carbs_g := targets.carbs_g;
        NEW.daily_fats_g := targets.fats_g;
        NEW.onboarding_completed := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER calculate_targets_on_profile_update
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_daily_targets(); 