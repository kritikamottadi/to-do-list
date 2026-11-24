export type Priority = 'low' | 'medium' | 'high';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type NavView = 'my-day' | 'upcoming' | 'all' | 'completed';

export type ViewMode = 'list' | 'grid';

export type SortField = 'due_date' | 'priority' | 'created_at';

export type StatusFilter = 'all' | 'active' | 'completed';

export type PaperTone = 'ivory' | 'blush' | 'sage';

export interface PlannerUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export type StickerType =
  | 'washi_pink'
  | 'washi_sage'
  | 'washi_butter'
  | 'sparkle_ink'
  | 'star_gold'
  | 'pressed_daisy'
  | 'eucalyptus_sprig'
  | 'heart_wax'
  | 'ribbon_bow'
  | 'paper_clip'
  | 'espresso_cup'
  | 'stacked_books'
  | 'strawberry'
  | 'peach'
  | 'cloud_sketch'
  | 'curved_arrow'
  | 'motivational_note'
  | 'polaroid_frame';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: Priority;
  category_id: string | null;
  recurrence: Recurrence;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sticker {
  id: string;
  user_id: string;
  sticker_type: StickerType;
  custom_text: string | null;
  x_position: number;
  y_position: number;
  rotation: number;
  scale: number;
  layer_order: number;
  created_at: string;
}

export interface WorkspaceSettings {
  user_id: string;
  display_name: string;
  planner_mantra: string;
  paper_tone: PaperTone;
  default_view: ViewMode;
  updated_at: string;
}

export interface StationeryColorOption {
  name: string;
  hex: string;
}

export const STATIONERY_COLORS: StationeryColorOption[] = [
  { name: 'Burgundy Wine', hex: '#6D2E46' },
  { name: 'Dusty Rose', hex: '#C48291' },
  { name: 'Sage Leaf', hex: '#6E8268' },
  { name: 'Warm Butter', hex: '#C7A23E' },
  { name: 'Muted Lavender', hex: '#8474A1' },
  { name: 'Sepia Ink', hex: '#6F5446' },
  { name: 'Terracotta Clay', hex: '#A85D4C' },
  { name: 'Slate Indigo', hex: '#586B7D' },
];

export const DEFAULT_CATEGORIES_SEED: Array<{ name: string; color: string }> = [
  { name: 'College', color: '#6D2E46' },
  { name: 'Personal', color: '#C48291' },
  { name: 'Projects', color: '#6E8268' },
  { name: 'To-do', color: '#C7A23E' },
  { name: 'Events', color: '#8474A1' },
];

export const GREETINGS_BY_TIME = {
  morning: 'Morning pages, fresh ink.',
  afternoon: 'Steady pace through the afternoon.',
  evening: 'Winding down with quiet clarity.',
};
