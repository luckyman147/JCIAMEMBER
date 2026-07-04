-- ============================================================================
-- JPS: use each activity's configured activity_points instead of a generic
-- type-based multiplier.
--
-- Previously, the M/F/G/E component of the score used a hardcoded multiplier
-- per activity type/subtype (6-12) times the participation rating × 0.1 —
-- completely ignoring the activity_points value set when creating the
-- activity. Now: presence (a confirmed, non-"interested" participation row)
-- × that activity's own activity_points. No rating multiplier.
--
-- Redefines compute_jps_for_period() from 20250704010000_jps_realtime_triggers.sql —
-- recalculate_member_jps / recalculate_member_jps_year / the triggers are
-- unchanged, since they just call this function. Mirrors the equivalent
-- change in src/features/Members/services/jps/core.ts.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.compute_jps_for_period(
  p_member_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS TABLE(score integer, category text, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff           timestamptz := least(now(), p_period_end);

  v_member_created   timestamptz;
  v_effective_start  timestamptz;
  v_cotisation       boolean[];

  v_activity_points    numeric := 0;
  v_meetings_points    numeric := 0;
  v_formations_points  numeric := 0;
  v_ga_points          numeric := 0;
  v_events_points      numeric := 0;
  v_participation_count int := 0;
  v_total_activities    int := 0;

  v_task_points      numeric := 0;
  v_earned_points    numeric := 0;
  v_complaints_count int := 0;

  v_committee_count  int := 0;
  v_is_chef          boolean := false;
  v_committee_factor numeric := 0;

  v_actual_rate        numeric;
  v_participation_rate numeric;
  v_fee_multiplier     numeric;
  v_complaints_penalty numeric;
  v_final_score        numeric;
  v_category           text;
  v_details            jsonb;
BEGIN
  SELECT created_at, cotisation_status
    INTO v_member_created, v_cotisation
    FROM profiles WHERE id = p_member_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_effective_start := greatest(p_period_start, coalesce(v_member_created, p_period_start));

  -- Presence × the activity's own configured activity_points (no generic
  -- multiplier, no rating). No need to join meetings/formations/
  -- general_assemblies anymore since subtype no longer affects scoring.
  SELECT
    coalesce(sum(a.activity_points), 0),
    coalesce(sum(a.activity_points) FILTER (WHERE a.type = 'meeting'), 0),
    coalesce(sum(a.activity_points) FILTER (WHERE a.type = 'formation'), 0),
    coalesce(sum(a.activity_points) FILTER (WHERE a.type = 'general_assembly'), 0),
    coalesce(sum(a.activity_points) FILTER (WHERE a.type = 'event'), 0),
    count(*)
  INTO v_activity_points, v_meetings_points, v_formations_points, v_ga_points, v_events_points, v_participation_count
  FROM activity_participants ap
  JOIN activities a ON a.id = ap.activity_id
  WHERE ap.user_id = p_member_id
    AND coalesce(ap.is_interested, false) = false
    AND a.activity_begin_date >= p_period_start
    AND a.activity_begin_date <= v_cutoff;

  -- Tasks completed in period (mirrors getTaskMultiplier) — unchanged
  SELECT coalesce(sum(
    (CASE t.complexity WHEN 'lead' THEN 15 WHEN 'major' THEN 10 WHEN 'minor' THEN 4 ELSE 4 END)
    * coalesce(mt.star_rating, 3)
  ), 0)
  INTO v_task_points
  FROM member_tasks mt
  JOIN tasks t ON t.id = mt.task_id
  WHERE mt.member_id = p_member_id
    AND mt.status = 'completed'
    AND mt.updated_at >= p_period_start
    AND mt.updated_at <= p_period_end;

  -- Points earned in period, excluding JPS-sourced entries — unchanged
  SELECT coalesce(sum(points), 0) INTO v_earned_points
  FROM points_history
  WHERE member_id = p_member_id
    AND created_at >= p_period_start
    AND created_at <= p_period_end
    AND source_type <> 'jps';

  -- Total activities available in period (for participation rate denominator) — unchanged
  SELECT count(*) INTO v_total_activities
  FROM activities
  WHERE activity_begin_date >= v_effective_start
    AND activity_begin_date <= v_cutoff;

  -- Resolved complaints in period — unchanged
  SELECT count(*) INTO v_complaints_count
  FROM complaints
  WHERE member_id = p_member_id
    AND status = 'resolved'
    AND created_at >= p_period_start
    AND created_at <= p_period_end;

  -- Committee factor — unchanged
  SELECT count(DISTINCT t.id), coalesce(bool_or(tm.role = 'lead'), false)
  INTO v_committee_count, v_is_chef
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.member_id = p_member_id
    AND t.activity_id IS NOT NULL;

  v_committee_factor := coalesce(v_committee_count, 0) * (CASE WHEN v_is_chef THEN 1.5 ELSE 1 END);

  v_actual_rate := CASE WHEN v_total_activities > 0 THEN v_participation_count::numeric / v_total_activities ELSE 1 END;
  v_participation_rate := LEAST(
    1,
    CASE WHEN v_total_activities < 3 THEN GREATEST(0.8, v_actual_rate) ELSE GREATEST(0.1, v_actual_rate) END
  );

  v_fee_multiplier := CASE
    WHEN v_cotisation IS NULL THEN 1.0
    WHEN NOT EXISTS (SELECT 1 FROM unnest(v_cotisation) x WHERE coalesce(x, false) = false) THEN 1.1
    ELSE 1.0
  END;

  v_complaints_penalty := v_complaints_count * 25;

  v_final_score := GREATEST(
    0,
    (v_activity_points + v_task_points + v_earned_points + v_committee_factor)
      * v_participation_rate * v_fee_multiplier - v_complaints_penalty
  );

  v_category := CASE
    WHEN v_final_score <= 75 THEN 'Observer'
    WHEN v_final_score <= 200 THEN 'Active Citizen'
    WHEN v_final_score <= 400 THEN 'Rising Leader'
    WHEN v_final_score <= 650 THEN 'Impact Architect'
    ELSE 'Outstanding Leader'
  END;

  v_details := jsonb_build_object(
    'activityPoints', v_activity_points,
    'meetingsPoints', v_meetings_points,
    'formationsPoints', v_formations_points,
    'gaPoints', v_ga_points,
    'eventsPoints', v_events_points,
    'taskPoints', v_task_points,
    'earnedPoints', v_earned_points,
    'participationRate', v_participation_rate,
    'actualParticipationRate', v_actual_rate,
    'complaintsPenalty', v_complaints_penalty,
    'feeMultiplier', v_fee_multiplier,
    'committeeCount', v_committee_count,
    'committeeIsChef', v_is_chef,
    'committeeFactor', v_committee_factor
  );

  RETURN QUERY SELECT round(v_final_score)::integer, v_category, v_details;
END;
$$;

-- Recompute every existing member immediately with the corrected formula,
-- rather than waiting for their next data change to trigger it.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    BEGIN
      PERFORM public.recalculate_member_jps(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS trimester recompute failed for member %: %', r.id, SQLERRM;
    END;

    BEGIN
      PERFORM public.recalculate_member_jps_year(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS year recompute failed for member %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
