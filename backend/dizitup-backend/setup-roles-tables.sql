-- ============================================================
-- MULTI-ROLE STAFF DASHBOARD — DATABASE MIGRATION
-- ============================================================
-- Run this file against your PostgreSQL database once.
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- 1. New project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES admins(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pa_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_pa_employee ON project_assignments(employee_id);

-- 2. New tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES admins(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id);

-- 3. Extend project_updates
ALTER TABLE project_updates
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_role TEXT NOT NULL DEFAULT 'admin';
