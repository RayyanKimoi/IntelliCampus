-- Add index to improve mastery query performance
-- This speeds up the student courses page mastery lookups

-- Index for mastery queries by userId and courseId
CREATE INDEX IF NOT EXISTS idx_masteryGraph_userId_topicId 
ON "MasteryGraph" ("userId", "topicId");

-- Index for topic -> subject -> course traversal
CREATE INDEX IF NOT EXISTS idx_topic_subjectId 
ON "Topic" ("subjectId");

-- Index for subject -> course lookups
CREATE INDEX IF NOT EXISTS idx_subject_courseId 
ON "Subject" ("courseId");

-- Composite index for common mastery query pattern
CREATE INDEX IF NOT EXISTS idx_masteryGraph_performance 
ON "MasteryGraph" ("userId", "masteryScore" DESC);

-- Add comment
COMMENT ON INDEX idx_masteryGraph_userId_topicId IS 'Improves student mastery lookups by user and topic';
COMMENT ON INDEX idx_masteryGraph_performance IS 'Optimizes mastery score sorting and filtering';
