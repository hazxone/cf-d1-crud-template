-- Migration number: 0003 	 2025-11-12T00:00:00.000Z
-- Transform todos into items and add flexible tagging system for PKM

-- Create items table (enhanced todo with notes support)
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    item_type TEXT CHECK(item_type IN ('task', 'note', 'thought')) DEFAULT 'task',
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', NULL)) DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tags table for flexible tagging
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Create junction table for many-to-many relationship between items and tags
CREATE TABLE item_tags (
    item_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_completed ON items(completed);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_pinned ON items(pinned);
CREATE INDEX idx_items_archived ON items(archived);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_due_date ON items(due_date);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);

CREATE INDEX idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag_id ON item_tags(tag_id);

-- Migrate existing todos to items with type='task'
INSERT INTO items (id, user_id, content, item_type, completed, created_at, updated_at)
SELECT id, user_id, text, 'task', completed, created_at, updated_at FROM todos;

-- Create default tags from old todo types for each user
INSERT INTO tags (user_id, name, color)
SELECT DISTINCT user_id, type,
    CASE type
        WHEN 'personal' THEN '#f59e0b'
        WHEN 'work' THEN '#ea580c'
        WHEN 'shopping' THEN '#eab308'
        WHEN 'health' THEN '#22c55e'
        WHEN 'finance' THEN '#3b82f6'
        WHEN 'learning' THEN '#a855f7'
        WHEN 'home' THEN '#ec4899'
        WHEN 'other' THEN '#78716c'
        ELSE '#6366f1'
    END as color
FROM todos
WHERE type IS NOT NULL;

-- Map old todo types to new tags
INSERT INTO item_tags (item_id, tag_id)
SELECT t.id as item_id, tg.id as tag_id
FROM todos t
INNER JOIN tags tg ON t.user_id = tg.user_id AND t.type = tg.name
WHERE t.type IS NOT NULL;
