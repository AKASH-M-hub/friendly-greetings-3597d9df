-- =====================================================
-- SECURITY POLICY REPAIRS (Teaching mode runtime fixes)
-- =====================================================

-- Layer 1: identity_verification needs insert policy for first-time bootstrap
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_verification'
      AND policyname = 'Users can insert own identity verification'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can insert own identity verification"
      ON identity_verification FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Layer 1: device_logs requires insert policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_logs'
      AND policyname = 'Users can insert own device logs'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can insert own device logs"
      ON device_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Layer 2: skill_domains is public catalog; allow authenticated reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'skill_domains'
      AND policyname = 'Authenticated users can view skill domains'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated users can view skill domains"
      ON skill_domains FOR SELECT
      USING (auth.role() = ''authenticated'')
    ';
  END IF;
END $$;

-- Layer 3: teacher_performance needs insert/update for own record bootstrap + updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_performance'
      AND policyname = 'Teachers can insert own performance record'
  ) THEN
    EXECUTE '
      CREATE POLICY "Teachers can insert own performance record"
      ON teacher_performance FOR INSERT
      WITH CHECK (auth.uid() = teacher_id)
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teacher_performance'
      AND policyname = 'Teachers can update own performance record'
  ) THEN
    EXECUTE '
      CREATE POLICY "Teachers can update own performance record"
      ON teacher_performance FOR UPDATE
      USING (auth.uid() = teacher_id)
    ';
  END IF;
END $$;

-- Layer 3: session_feedback needs update policy for teacher confirmation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'session_feedback'
      AND policyname = 'Teachers can update own session feedback rows'
  ) THEN
    EXECUTE '
      CREATE POLICY "Teachers can update own session feedback rows"
      ON session_feedback FOR UPDATE
      USING (auth.uid() = teacher_id)
    ';
  END IF;
END $$;
