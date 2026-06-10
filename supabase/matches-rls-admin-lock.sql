-- Enable RLS on matches table (if not already enabled)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read matches
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);

-- Only admins can update matches (lock/unlock)
CREATE POLICY "matches_update_admin" ON matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
