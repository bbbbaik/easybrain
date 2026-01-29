-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search (optional, for future search features)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50), -- Icon identifier
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- FOLDERS TABLE (Recursive Structure)
-- ============================================
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_hierarchy CHECK (
    (category_id IS NOT NULL AND parent_id IS NULL) OR
    (category_id IS NULL AND parent_id IS NOT NULL)
  )
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT, -- Markdown content
  status task_status NOT NULL DEFAULT 'todo',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- Hex color code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- TASK_TAGS (Many-to-Many)
-- ============================================
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ============================================
-- TASK_ATTACHMENTS TABLE
-- ============================================
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TASK_REMINDERS TABLE
-- ============================================
CREATE TYPE reminder_recurrence AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');

CREATE TABLE task_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_date TIMESTAMPTZ NOT NULL,
  recurrence reminder_recurrence NOT NULL DEFAULT 'none',
  recurrence_rule TEXT, -- JSON string for complex recurrence rules
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TASK_LINKS TABLE (for @mentions and hyperlinks)
-- ============================================
CREATE TABLE task_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type VARCHAR(20) DEFAULT 'mention', -- 'mention', 'reference', 'related'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_task_id, to_task_id),
  CONSTRAINT no_self_link CHECK (from_task_id != to_task_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_name ON categories(user_id, name);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_category_id ON folders(category_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_user_category ON folders(user_id, category_id);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_folder_id ON tasks(folder_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_is_important ON tasks(is_important);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_user_name ON tags(user_id, name);

CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_user_id ON task_attachments(user_id);

CREATE INDEX idx_task_reminders_task_id ON task_reminders(task_id);
CREATE INDEX idx_task_reminders_user_id ON task_reminders(user_id);
CREATE INDEX idx_task_reminders_reminder_date ON task_reminders(reminder_date);
CREATE INDEX idx_task_reminders_enabled ON task_reminders(is_enabled) WHERE is_enabled = TRUE;

CREATE INDEX idx_task_links_from_task ON task_links(from_task_id);
CREATE INDEX idx_task_links_to_task ON task_links(to_task_id);
CREATE INDEX idx_task_links_user_id ON task_links(user_id);

-- ============================================
-- FUNCTIONS for updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_reminders_updated_at BEFORE UPDATE ON task_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FOLDERS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASKS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TAGS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASK_TAGS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view task_tags for their own tasks"
  ON task_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert task_tags for their own tasks"
  ON task_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tags WHERE tags.id = task_tags.tag_id AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task_tags for their own tasks"
  ON task_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    )
  );

-- ============================================
-- TASK_ATTACHMENTS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own task attachments"
  ON task_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task attachments"
  ON task_attachments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task attachments"
  ON task_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASK_REMINDERS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view their own task reminders"
  ON task_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task reminders"
  ON task_reminders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_reminders.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task reminders"
  ON task_reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task reminders"
  ON task_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASK_LINKS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view task links for their own tasks"
  ON task_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert task links for their own tasks"
  ON task_links FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_links.from_task_id AND tasks.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_links.to_task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task links for their own tasks"
  ON task_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-set user_id on insert
-- ============================================
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We're not using triggers for user_id since we'll set it explicitly in the application
-- But this function is available if needed
