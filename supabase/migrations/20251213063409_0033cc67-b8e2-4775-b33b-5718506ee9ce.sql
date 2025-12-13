-- Create goals table for tracking revenue and conversion targets
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('revenue', 'conversion_rate')),
  target_value NUMERIC(15, 2) NOT NULL CHECK (target_value > 0),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Create index for active goals queries
CREATE INDEX idx_goals_active ON goals(is_active, period_start, period_end) WHERE is_active = true;

-- Create index for goal type queries
CREATE INDEX idx_goals_type ON goals(goal_type, period_start DESC);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage goals
CREATE POLICY "Users can manage their goals" ON goals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();