-- ============================================================================
-- JPS realtime scoring
--
-- Problem: the JCI Performance Score (JPS) leaderboard only updated when an
-- executive clicked "Recalculate", which recomputed EVERY member from
-- scratch. This migration moves the calculation into the database so a
-- single member's score is recomputed automatically, in real time, the
-- moment one of their own inputs changes (a rating, a completed task,
-- points, cotisation status, a resolved complaint, or a committee change) —
-- never touching other members' rows.
--
-- Two scores are maintained per member:
--   - Trimester score (jps_snapshots)      — current 3-month window
--   - Year score      (jps_year_snapshots) — Jan 1 through today, same formula
--
-- Formula (mirrors src/features/Members/services/jps/core.ts), shared by both:
--   score = max(0,
--     (activityPoints + taskPoints + earnedPoints + committeeFactor)
--     * participationRate * feeMultiplier - complaintsPenalty
--   )
--   committeeFactor = committeeCount * (1.5 if chef of any committee else 1)
--   "committee" = a team whose activity_id is not null (sponsoring/media/
--   program/logistic teams created via the activity-committees feature).
--   Both scores use the same category thresholds (Observer .. Outstanding
--   Leader) — a year window naturally accumulates more raw points than a
--   trimester one, so year scores will trend toward higher categories; that's
--   expected, not a bug.
--
-- Verified against live schema via information_schema.columns before writing
-- this (see conversation) — in particular: formations/meetings/
-- general_assemblies share their PK with activities.id (not activity_id),
-- and profiles.cotisation_status is boolean[2] (default {false,false}).
--
-- IMPORTANT — test after applying:
--   1. Pick a test member id and a recent activity they attended.
--   2. Update its activity_participants.rate for that member.
--   3. Run: select score, details from jps_snapshots
--            where member_id = '<id>' order by created_at desc limit 1;
--      and: select score, details from jps_year_snapshots where member_id = '<id>';
--   4. Confirm both scores changed. If they silently don't, check Postgres
--      logs for "JPS recalculation failed" warnings — the trigger is
--      designed to never block the write that fired it, so a bug here
--      fails silently unless you check the log.
-- ============================================================================

-- jps_snapshots had no updated_at column, so the leaderboard's "Last Update" label
-- was showing today's date unconditionally rather than the real last-recalculated time.
ALTER TABLE jps_snapshots ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS jps_year_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year int NOT NULL,
  score integer NOT NULL,
  category text NOT NULL,
  details jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, year)
);

-- ─── Shared calculation core (parametrized by period) ─────────────────────────
-- Both the trimester and the year score call this with different bounds, so
-- the two can never drift out of sync with each other.

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

  -- Participations in period, with per-type/subtype multiplier (mirrors getActivityMultiplier)
  WITH parts AS (
    SELECT
      a.type,
      coalesce(ap.rate, 3) AS rate,
      CASE
        WHEN a.type = 'general_assembly' THEN
          CASE WHEN ga.assembly_type IN ('national', 'international') THEN 12
               WHEN ga.assembly_type = 'zonal' THEN 9
               ELSE 6 END
        WHEN a.type = 'meeting' THEN
          CASE WHEN m.meeting_type = 'official' THEN 10
               WHEN m.meeting_type = 'committee' THEN 7
               ELSE 8 END
        WHEN a.type = 'formation' THEN
          CASE WHEN f.training_type::text = 'official_session' THEN 9
               WHEN f.training_type::text = 'important_training' THEN 7
               WHEN f.training_type::text = 'member_to_member' THEN 4
               ELSE 5 END
        WHEN a.type = 'event' THEN 8
        ELSE 5
      END AS multiplier
    FROM activity_participants ap
    JOIN activities a ON a.id = ap.activity_id
    LEFT JOIN meetings m ON a.type = 'meeting' AND m.id = a.id
    LEFT JOIN formations f ON a.type = 'formation' AND f.id = a.id
    LEFT JOIN general_assemblies ga ON a.type = 'general_assembly' AND ga.id = a.id
    WHERE ap.user_id = p_member_id
      AND coalesce(ap.is_interested, false) = false
      AND a.activity_begin_date >= p_period_start
      AND a.activity_begin_date <= v_cutoff
  )
  SELECT
    coalesce(sum(multiplier * rate * 0.1), 0),
    coalesce(sum(multiplier * rate * 0.1) FILTER (WHERE type = 'meeting'), 0),
    coalesce(sum(multiplier * rate * 0.1) FILTER (WHERE type = 'formation'), 0),
    coalesce(sum(multiplier * rate * 0.1) FILTER (WHERE type = 'general_assembly'), 0),
    coalesce(sum(multiplier * rate * 0.1) FILTER (WHERE type = 'event'), 0),
    count(*)
  INTO v_activity_points, v_meetings_points, v_formations_points, v_ga_points, v_events_points, v_participation_count
  FROM parts;

  -- Tasks completed in period (mirrors getTaskMultiplier)
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

  -- Points earned in period, excluding JPS-sourced entries
  SELECT coalesce(sum(points), 0) INTO v_earned_points
  FROM points_history
  WHERE member_id = p_member_id
    AND created_at >= p_period_start
    AND created_at <= p_period_end
    AND source_type <> 'jps'; -- matches the TS `.neq('source_type', 'jps')`, which also excludes NULL rows

  -- Total activities available in period (for participation rate denominator)
  SELECT count(*) INTO v_total_activities
  FROM activities
  WHERE activity_begin_date >= v_effective_start
    AND activity_begin_date <= v_cutoff;

  -- Resolved complaints in period
  SELECT count(*) INTO v_complaints_count
  FROM complaints
  WHERE member_id = p_member_id
    AND status = 'resolved'
    AND created_at >= p_period_start
    AND created_at <= p_period_end;

  -- Committee factor: activity-committees (teams with activity_id set) the member belongs to.
  -- Not period-scoped — this reflects current standing, same as the TS client calc.
  SELECT count(DISTINCT t.id), coalesce(bool_or(tm.role = 'lead'), false)
  INTO v_committee_count, v_is_chef
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.member_id = p_member_id
    AND t.activity_id IS NOT NULL;

  v_committee_factor := coalesce(v_committee_count, 0) * (CASE WHEN v_is_chef THEN 1.5 ELSE 1 END);

  -- Rates and multipliers
  v_actual_rate := CASE WHEN v_total_activities > 0 THEN v_participation_count::numeric / v_total_activities ELSE 1 END;
  v_participation_rate := LEAST(
    1,
    CASE WHEN v_total_activities < 3 THEN GREATEST(0.8, v_actual_rate) ELSE GREATEST(0.1, v_actual_rate) END
  );

  -- Mirrors JS `cotisation_status?.every(Boolean)`: null -> false, all-true -> true, any false/null -> false
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

-- ─── Trimester score: upserts jps_snapshots for the member's current trimester ─

CREATE OR REPLACE FUNCTION public.recalculate_member_jps(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year         int := extract(year from now())::int;
  v_month        int := extract(month from now())::int;
  v_trimester    int := ((extract(month from now())::int - 1) / 3) + 1;
  v_period_start timestamptz := make_timestamptz(v_year, ((v_trimester - 1) * 3) + 1, 1, 0, 0, 0);
  v_period_end   timestamptz := v_period_start + interval '3 months' - interval '1 second';
  v_result       RECORD;
  v_existing_id  uuid;
BEGIN
  SELECT * INTO v_result FROM public.compute_jps_for_period(p_member_id, v_period_start, v_period_end);
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT id INTO v_existing_id FROM jps_snapshots
  WHERE member_id = p_member_id AND year = v_year AND month = v_month AND trimester = v_trimester;

  IF v_existing_id IS NOT NULL THEN
    UPDATE jps_snapshots
    SET score = v_result.score, category = v_result.category, details = v_result.details, updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO jps_snapshots (member_id, year, month, trimester, score, category, details)
    VALUES (p_member_id, v_year, v_month, v_trimester, v_result.score, v_result.category, v_result.details);
  END IF;
END;
$$;

-- ─── Year score: upserts jps_year_snapshots for Jan 1 through today ────────────

CREATE OR REPLACE FUNCTION public.recalculate_member_jps_year(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year         int := extract(year from now())::int;
  v_period_start timestamptz := make_timestamptz(v_year, 1, 1, 0, 0, 0);
  v_period_end   timestamptz := make_timestamptz(v_year, 12, 31, 23, 59, 59);
  v_result       RECORD;
BEGIN
  SELECT * INTO v_result FROM public.compute_jps_for_period(p_member_id, v_period_start, v_period_end);
  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO jps_year_snapshots (member_id, year, score, category, details, updated_at)
  VALUES (p_member_id, v_year, v_result.score, v_result.category, v_result.details, now())
  ON CONFLICT (member_id, year)
  DO UPDATE SET score = excluded.score, category = excluded.category, details = excluded.details, updated_at = now();
END;
$$;

-- ─── Generic trigger dispatcher ────────────────────────────────────────────────
-- Wrapped so a bug in scoring can never block the real write (attendance,
-- task completion, etc). Trimester and year are recalculated independently so
-- one failing doesn't stop the other. Failures are logged as Postgres warnings.

CREATE OR REPLACE FUNCTION public.trg_recalculate_jps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_team_activity_id uuid;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'activity_participants' THEN
      v_member_id := COALESCE(NEW.user_id, OLD.user_id);
    WHEN 'member_tasks' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'points_history' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'complaints' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'profiles' THEN
      v_member_id := NEW.id;
    WHEN 'team_members' THEN
      SELECT activity_id INTO v_team_activity_id FROM teams WHERE id = COALESCE(NEW.team_id, OLD.team_id);
      IF v_team_activity_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    ELSE
      RETURN COALESCE(NEW, OLD);
  END CASE;

  IF v_member_id IS NOT NULL THEN
    BEGIN
      PERFORM public.recalculate_member_jps(v_member_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS trimester recalculation failed for member %: %', v_member_id, SQLERRM;
    END;

    BEGIN
      PERFORM public.recalculate_member_jps_year(v_member_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS year recalculation failed for member %: %', v_member_id, SQLERRM;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── Triggers ──────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS jps_on_activity_participants ON activity_participants;
CREATE TRIGGER jps_on_activity_participants
AFTER INSERT OR UPDATE OR DELETE ON activity_participants
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_jps();

DROP TRIGGER IF EXISTS jps_on_member_tasks ON member_tasks;
CREATE TRIGGER jps_on_member_tasks
AFTER INSERT OR UPDATE OR DELETE ON member_tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_jps();

DROP TRIGGER IF EXISTS jps_on_points_history ON points_history;
CREATE TRIGGER jps_on_points_history
AFTER INSERT OR UPDATE OR DELETE ON points_history
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_jps();

DROP TRIGGER IF EXISTS jps_on_complaints ON complaints;
CREATE TRIGGER jps_on_complaints
AFTER INSERT OR UPDATE OR DELETE ON complaints
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_jps();

DROP TRIGGER IF EXISTS jps_on_profiles_cotisation ON profiles;
CREATE TRIGGER jps_on_profiles_cotisation
AFTER UPDATE OF cotisation_status ON profiles
FOR EACH ROW
WHEN (NEW.cotisation_status IS DISTINCT FROM OLD.cotisation_status)
EXECUTE FUNCTION public.trg_recalculate_jps();

DROP TRIGGER IF EXISTS jps_on_team_members ON team_members;
CREATE TRIGGER jps_on_team_members
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_jps();

-- ─── Realtime ──────────────────────────────────────────────────────────────────
-- Each wrapped in its own exception handler: a pasted multi-statement script
-- runs as one implicit transaction, so if a publication doesn't exist (or is
-- named differently in your project), an unguarded failure here would roll
-- back everything above it too — silently undoing the table/function/trigger
-- setup while looking like the whole migration succeeded.

DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'jps_snapshots'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.jps_snapshots;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not enable realtime on jps_snapshots (publication may not exist or already includes it): %', SQLERRM;
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'jps_year_snapshots'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.jps_year_snapshots;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not enable realtime on jps_year_snapshots (publication may not exist or already includes it): %', SQLERRM;
  END;
END $$;
