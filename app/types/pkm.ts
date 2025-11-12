// PKM (Personal Knowledge Management) System Types

export type ItemType = 'task' | 'note' | 'thought';

export type Priority = 'low' | 'medium' | 'high' | null;

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export interface Item {
  id: number;
  user_id: number;
  content: string;
  item_type: ItemType;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface ItemTag {
  item_id: number;
  tag_id: number;
  created_at: string;
}

// Item with its associated tags (for frontend display)
export interface ItemWithTags extends Item {
  tags: Tag[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types
export interface CreateItemRequest {
  userId: number;
  content: string;
  item_type: ItemType;
  tags?: number[]; // Array of tag IDs
  priority?: Priority;
  due_date?: string;
  pinned?: boolean;
}

export interface UpdateItemRequest {
  content?: string;
  item_type?: ItemType;
  completed?: boolean;
  priority?: Priority;
  due_date?: string;
  pinned?: boolean;
  archived?: boolean;
  tags?: number[]; // Array of tag IDs to replace existing tags
}

export interface CreateTagRequest {
  userId: number;
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

// Search and filter types
export interface ItemFilters {
  item_type?: ItemType | 'all';
  completed?: boolean | 'all';
  archived?: boolean;
  pinned?: boolean;
  tags?: number[]; // Filter by tag IDs
  search?: string; // Text search in content
  due_date_from?: string;
  due_date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
}

// View modes
export type ViewMode = 'table' | 'timeline' | 'tags';

// Timeline grouping
export interface TimelineGroup {
  date: string; // YYYY-MM-DD
  items: ItemWithTags[];
}
