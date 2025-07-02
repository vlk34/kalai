-- Create Foods_consumed table for Supabase
CREATE TABLE Foods_consumed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    protein DECIMAL(6,2),    -- e.g., 9999.99g
    carbs DECIMAL(6,2),      -- e.g., 9999.99g  
    fats DECIMAL(6,2),       -- e.g., 9999.99g
    calories DECIMAL(7,2),   -- e.g., 99999.99 kcal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for better query performance
CREATE INDEX idx_foods_consumed_user_id ON Foods_consumed(user_id);

-- Create an index on created_at for chronological queries
CREATE INDEX idx_foods_consumed_created_at ON Foods_consumed(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE Foods_consumed ENABLE ROW LEVEL SECURITY;

-- Create RLS policy so users can only access their own food records
CREATE POLICY "Users can view own food records" ON Foods_consumed
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food records" ON Foods_consumed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food records" ON Foods_consumed
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food records" ON Foods_consumed
    FOR DELETE USING (auth.uid() = user_id); 