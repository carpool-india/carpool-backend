-- 012_device_tokens_storage.sql widened users' SELECT policy from self-only to
-- `USING (true)`, and 011_rls_policies.sql shipped driver_profiles_select as
-- `USING (true)` from day one. Together these let any authenticated caller read
-- every user's phone number, verification flags, and admin status straight off
-- the Supabase REST API (bypassing the backend entirely), and every driver's
-- licence number, HyperVerge transaction IDs, and partial bank account/IFSC
-- details the same way.
--
-- The tables genuinely need to expose a *few* fields cross-user (a trip's other
-- party needs a name/photo for chat and the passenger list; ratings/trust-score
-- lookups need someone else's verification flags and cancellation count), so
-- this can't just be reverted to a bare self-only policy without breaking those
-- reads. Instead: lock the base tables down to self-only, and add narrow public
-- views carrying only the fields already meant to be public (the same set
-- surfaced today via TripWithDriver -- name, photo, gender, trust score,
-- verification badges -- for users; trip-count/reliability stats for drivers,
-- never the licence/bank columns). Application code that was embedding
-- `users(...)`/`driver_profiles(...)` in a cross-user PostgREST select now
-- reads these views instead (see chat.service.ts, trip.service.ts's
-- listTripPassengers, trust.service.ts's listBlockedUsers, and
-- trustScore.service.ts).

DROP POLICY IF EXISTS users_select_authenticated ON users;

-- NOT `... OR id = public.current_app_user_id()` (the original 011 policy,
-- before 012 immediately widened it to USING(true) and this clause never
-- actually ran in production): current_app_user_id() is not SECURITY DEFINER,
-- so it queries `users` under the CALLER's own RLS -- i.e. THIS policy again.
-- First real-world exercise of this exact clause (via this migration)
-- produced infinite recursion / "stack depth limit exceeded" on every
-- authenticated users query, including the profile fetch right after OTP
-- login. The dropped clause was redundant anyway: current_app_user_id()
-- resolves to the row where supabase_auth_id = auth.uid(), so `id =
-- current_app_user_id()` and `supabase_auth_id = auth.uid()` are true for
-- exactly the same row -- the first clause alone is already a complete,
-- non-recursive self-check.
CREATE POLICY users_select_own ON users
  FOR SELECT TO authenticated
  USING (supabase_auth_id = auth.uid());

DROP POLICY IF EXISTS driver_profiles_select ON driver_profiles;
-- driver_profiles_write_own (FOR ALL, self-scoped) already covers SELECT for a
-- driver's own row, so no replacement self-scoped SELECT policy is needed here.

-- Supabase applies its own default privileges to `anon`/`authenticated` on
-- every new relation in `public` (separate from, and not covered by, a plain
-- REVOKE ... FROM PUBLIC) -- a fresh view here starts out with far more than
-- SELECT granted, including INSERT/UPDATE/DELETE. Since these are simple
-- single-table projections, Postgres treats them as auto-updatable views, so
-- those extra grants would let a write through the view reach the real
-- `users`/`driver_profiles` row, bypassing RLS the same way SELECT does here
-- on purpose. Revoke everything from both roles before granting back only
-- the narrow SELECT this migration actually intends.
CREATE VIEW public.user_public_profiles AS
SELECT id, name, photo_url, gender, trust_score, aadhaar_verified, dl_verified, face_match_done
FROM public.users;

REVOKE ALL ON public.user_public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_public_profiles TO authenticated;

CREATE VIEW public.driver_public_profiles AS
SELECT id, user_id, years_of_experience, total_trips, cancellation_count, reliability_score, created_at
FROM public.driver_profiles;

REVOKE ALL ON public.driver_public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.driver_public_profiles TO authenticated;

-- get_trust_score_breakdown(p_user_id) is explicitly designed to let one user
-- view ANOTHER's trust breakdown (e.g. a passenger checking why a driver has a
-- given score), but it was never marked SECURITY DEFINER, so its internal
-- `users`/`driver_profiles`/`bookings` reads ran under the CALLER's RLS -- it
-- only worked because of the two USING(true) policies above, and even then
-- silently undercounted a target's completed/cancelled bookings whenever the
-- caller wasn't a party to them. SECURITY DEFINER fixes both: RLS-independent
-- (works now that users/driver_profiles are locked down) and accurate (counts
-- every relevant row, not just ones the caller could already see).
-- As with the views above, Supabase grants EXECUTE to `anon`/`authenticated`
-- directly (independent of PUBLIC) on every new/replaced function in
-- `public`, so both roles must be named explicitly in the REVOKE, not just
-- PUBLIC, or `anon` keeps the ability to call this unauthenticated.
ALTER FUNCTION public.get_trust_score_breakdown(UUID) SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_trust_score_breakdown(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trust_score_breakdown(UUID) TO authenticated;

-- Separately: rating.service.ts's submitRating calls recalculateTrustScore(client,
-- rateeId) with the RATER's own client, and that function ends with
-- `client.from("users").update({trust_score, ...}).eq("id", userId)`. users_update_own
-- has always been self-only (never widened like the SELECT policy was), so this
-- UPDATE has always silently affected zero rows whenever the ratee isn't the
-- rater -- i.e. every rating submission, since rating yourself is rejected
-- earlier in the same function. A rated user's trust_score/average_stars never
-- actually changed. Fix it the same way as get_trust_score_breakdown: a
-- SECURITY DEFINER function that recomputes from real data and writes the
-- result -- never one that accepts a caller-supplied score, since anything
-- GRANTed to `authenticated` is directly callable by any signed-in client via
-- the Supabase REST API, not just from this backend.
CREATE OR REPLACE FUNCTION public.recalculate_and_store_trust_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_breakdown JSONB;
  v_score INTEGER;
  v_avg_stars NUMERIC;
  v_rating_count INTEGER;
BEGIN
  v_breakdown := public.get_trust_score_breakdown(p_user_id);
  IF v_breakdown IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
  v_score := (v_breakdown->>'total')::INTEGER;
  v_avg_stars := (v_breakdown->>'averageStars')::NUMERIC;
  v_rating_count := (v_breakdown->>'ratingCount')::INTEGER;

  UPDATE users
  SET trust_score = v_score, average_stars = v_avg_stars, rating_count = v_rating_count
  WHERE id = p_user_id;

  RETURN v_score;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_and_store_trust_score(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_and_store_trust_score(UUID) TO authenticated;
