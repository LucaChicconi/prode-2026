-- Reset all player scores to 0 for World Cup Phase 2 (knockout stage)
UPDATE public.profiles
SET total_points = 0,
    knockout_points = 0,
    elijo_creer_bonus = 0;
