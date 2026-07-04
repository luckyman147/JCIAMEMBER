-- Link projects to activities with cascade delete
ALTER TABLE projects ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projects_activity ON projects(activity_id);

-- Ensure teams cascade delete with activity
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_activity_id_fkey;
ALTER TABLE teams ADD CONSTRAINT teams_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;

-- Ensure teams.project_id sets null on project delete (not cascade)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_project_id_fkey;
ALTER TABLE teams ADD CONSTRAINT teams_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
