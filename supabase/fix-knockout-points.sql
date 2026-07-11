-- Fix knockout_points without recalculating group stage
-- Step 1: Snapshot old knockout_points
CREATE TEMP TABLE _old_knockout AS
SELECT id, COALESCE(knockout_points, 0) AS old_kp FROM public.profiles;

-- Step 2: Recalculate knockout_points from knockout_predictions vs knockout_matches
SELECT public.recalculate_knockout_points();

-- Step 3: Adjust total_points by the delta only
UPDATE public.profiles pr
SET total_points = COALESCE(pr.total_points, 0)
                 + COALESCE(pr.knockout_points, 0)
                 - COALESCE(ok.old_kp, 0)
FROM _old_knockout ok
WHERE pr.id = ok.id;

-- Cleanup
DROP TABLE _old_knockout;
