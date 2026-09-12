-- Hardening pass over the RLS policies added in 026_reports_blocks_instant_book_ratings.sql.
--
-- 1) user_blocks: the existing user_blocks_manage_own policy scopes SELECT (along
--    with INSERT/UPDATE/DELETE) to `blocker_id = current_app_user_id()` -- i.e. a
--    user can only see blocks THEY placed. backend/services/booking/src/services/
--    booking.service.ts's isBlocked() runs an OR() query across BOTH directions
--    (driver blocked passenger OR passenger blocked driver) using the caller's own
--    RLS-scoped client, expecting to see a block placed by either party before
--    letting a booking through. Under the current policy, the half of that OR()
--    where the OTHER party is the blocker gets silently stripped by RLS, so a
--    passenger who was blocked by a driver (or vice versa) can still book them --
--    the block is effectively unenforceable from the blocked party's side.
--
--    The fix is not to widen the SELECT policy to expose raw blocker_id/blocked_id
--    rows in both directions -- that would let a user discover "who blocked me",
--    which is exactly the retaliation/harassment vector 026 already avoids for
--    user_reports (user_reports_select_own intentionally only shows reports YOU
--    filed, never ones filed about you). Instead, mirror the is_trip_party()
--    approach from 024_messages.sql: a SECURITY DEFINER helper that bypasses RLS
--    internally but only ever returns a boolean, never the underlying rows.
CREATE OR REPLACE FUNCTION public.users_have_mutual_block(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

REVOKE ALL ON FUNCTION public.users_have_mutual_block(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.users_have_mutual_block(UUID, UUID) TO authenticated;

-- 2) 026's user_reports_insert_own, user_reports_select_own and
--    user_blocks_manage_own policies were all written without a "TO authenticated"
--    clause, so (unlike every policy in 011_rls_policies.sql, 016_subscriptions.sql
--    and 024_messages.sql) they apply to PUBLIC, including the anon role. In
--    practice current_app_user_id() returns NULL for an unauthenticated request
--    (auth.uid() is NULL when there's no JWT), and reporter_id/blocker_id are
--    NOT NULL columns, so "= NULL" never matches and anon access is already denied
--    -- but that safety is incidental (a property of the helper function), not
--    something the policy itself guarantees. Scope them explicitly, matching the
--    rest of the schema's convention, so the access grant doesn't rely on that.
ALTER POLICY user_reports_insert_own ON user_reports TO authenticated;
ALTER POLICY user_reports_select_own ON user_reports TO authenticated;
ALTER POLICY user_blocks_manage_own ON user_blocks TO authenticated;
