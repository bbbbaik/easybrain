-- Add position column to tasks for ordering within a folder
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Index for ordering by folder + position
CREATE INDEX IF NOT EXISTS idx_tasks_folder_position ON tasks(folder_id, position);

-- Backfill: set position from created_at order per folder (optional, for existing rows)
-- UPDATE tasks t SET position = sub.rn - 1
-- FROM (
--   SELECT id, ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY created_at ASC) AS rn
--   FROM tasks
-- ) sub WHERE t.id = sub.id;
