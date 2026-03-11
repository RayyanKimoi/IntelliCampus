-- CreateTable: StageProgress
-- This table tracks student progress through gamification arena stages
-- Each student can have progress for 4 stages, tracking completed games and percentage

CREATE TABLE IF NOT EXISTS "stage_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stage_id" INTEGER NOT NULL,
    "completed_games" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stage_progress_user_id_stage_id_key" ON "stage_progress"("user_id", "stage_id");

-- CreateIndex
CREATE INDEX "stage_progress_user_id_idx" ON "stage_progress"("user_id");

-- AddForeignKey
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
