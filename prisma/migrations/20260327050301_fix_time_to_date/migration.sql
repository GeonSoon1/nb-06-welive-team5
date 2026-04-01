-- Rename existing Vote time columns to date columns while preserving data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vote'
      AND column_name = 'startTime'
  ) THEN
    ALTER TABLE "Vote" RENAME COLUMN "startTime" TO "startDate";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vote'
      AND column_name = 'endTime'
  ) THEN
    ALTER TABLE "Vote" RENAME COLUMN "endTime" TO "endDate";
  END IF;
END $$;
