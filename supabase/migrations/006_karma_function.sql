-- Create adjust_karma function for safe karma score updates
-- This ensures karma stays within 0-100 range

CREATE OR REPLACE FUNCTION adjust_karma(p_patient_id UUID, p_points INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE patient_profiles
  SET karma_score = GREATEST(0, LEAST(100, karma_score + p_points))
  WHERE id = p_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION adjust_karma(UUID, INTEGER) TO anon, authenticated;
