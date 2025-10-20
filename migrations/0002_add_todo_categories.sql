-- Migration number: 0002 	 2025-10-20T09:09:05.571Z
-- Add more todo categories

-- First, drop the existing CHECK constraint
-- SQLite doesn't support ALTER CONSTRAINT, so we need to recreate the table
CREATE TABLE todos_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    type TEXT CHECK(type IN ('personal', 'work', 'shopping', 'health', 'finance', 'learning', 'home', 'other')) DEFAULT 'personal',
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO todos_new (id, user_id, text, type, completed, created_at, updated_at)
SELECT id, user_id, text, type, completed, created_at, updated_at FROM todos;

-- Drop old table
DROP TABLE todos;

-- Rename new table to original name
ALTER TABLE todos_new RENAME TO todos;

-- Recreate indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_type ON todos(type);
