-- Create user_streaks table for tracking individual streak days
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_date)
);

-- Create index for faster queries on user_id and streak_date
CREATE INDEX idx_user_streaks_user_date ON user_streaks(user_id, streak_date DESC);

-- Add Row Level Security (RLS)
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own streak data
CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" ON user_streaks
    FOR DELETE USING (auth.uid() = user_id); 