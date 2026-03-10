CREATE TABLE IF NOT EXISTS "integrity_policies" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "institution_id" TEXT NOT NULL,
  "rapid_guessing_enabled" BOOLEAN NOT NULL DEFAULT true,
  "rapid_guessing_threshold" INTEGER NOT NULL DEFAULT 10,
  "tab_switching_enabled" BOOLEAN NOT NULL DEFAULT true,
  "tab_switching_threshold" INTEGER NOT NULL DEFAULT 5,
  "copy_paste_enabled" BOOLEAN NOT NULL DEFAULT true,
  "high_anomaly_enabled" BOOLEAN NOT NULL DEFAULT true,
  "unusual_pattern_enabled" BOOLEAN NOT NULL DEFAULT true,
  "fast_completion_enabled" BOOLEAN NOT NULL DEFAULT true,
  "fast_completion_threshold" INTEGER NOT NULL DEFAULT 40,
  "multiple_reattempt_enabled" BOOLEAN NOT NULL DEFAULT true,
  "similarity_detected_enabled" BOOLEAN NOT NULL DEFAULT true,
  "similarity_threshold" INTEGER NOT NULL DEFAULT 80,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "integrity_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "integrity_policies_institution_id_key" ON "integrity_policies"("institution_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integrity_policies_institution_id_fkey'
  ) THEN
    ALTER TABLE "integrity_policies"
      ADD CONSTRAINT "integrity_policies_institution_id_fkey"
      FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
