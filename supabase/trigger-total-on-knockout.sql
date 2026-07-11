-- Trigger: recalculate total_points when knockout data changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_total_on_knockout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.recalculate_total_points();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalculate_total_on_knockout_matches ON public.knockout_matches;
CREATE TRIGGER trigger_recalculate_total_on_knockout_matches
AFTER INSERT OR UPDATE OR DELETE ON public.knockout_matches
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_recalculate_total_on_knockout();

DROP TRIGGER IF EXISTS trigger_recalculate_total_on_knockout_predictions ON public.knockout_predictions;
CREATE TRIGGER trigger_recalculate_total_on_knockout_predictions
AFTER INSERT OR UPDATE OR DELETE ON public.knockout_predictions
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_recalculate_total_on_knockout();
