import { getLocalAuthToken, getSupabaseClient } from './supabase';
import {
  DEFAULT_CATEGORIES_SEED,
  type Category,
  type PlannerUser,
  type Priority,
  type Recurrence,
  type Sticker,
  type StickerType,
  type Task,
  type WorkspaceSettings,
} from '../types/planner';
import { computeNextDueDate } from './dateUtils';

async function localApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getLocalAuthToken();
  if (!token) {
    throw new Error('Authentication required.');
  }
  const res = await fetch(`/api/local-planner${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((payload as { error?: string }).error || 'Request failed.');
  }
  return payload as T;
}

export async function ensureInitialUserData(user: PlannerUser): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const [{ data: existingSettings }, { data: existingCategories }] = await Promise.all([
    client
      .from('workspace_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    client
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
  ]);

  if (!existingSettings) {
    const fallbackName =
      user.user_metadata?.full_name?.trim() ||
      user.email?.split('@')[0] ||
      'Planner Owner';

    await client.from('workspace_settings').upsert(
      {
        user_id: user.id,
        display_name: fallbackName,
        planner_mantra: 'A little progress goes a long way.',
        paper_tone: 'ivory',
        default_view: 'list',
      },
      { onConflict: 'user_id' }
    );
  }

  if (!existingCategories || existingCategories.length === 0) {
    await client.from('categories').insert(
      DEFAULT_CATEGORIES_SEED.map((cat) => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
      }))
    );
  }
}

export async function fetchPlannerData(userId: string): Promise<{
  tasks: Task[];
  categories: Category[];
  stickers: Sticker[];
  settings: WorkspaceSettings;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi('/data');
  }

  const [tasksRes, categoriesRes, stickersRes, settingsRes] = await Promise.all([
    client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    client
      .from('stickers')
      .select('*')
      .eq('user_id', userId)
      .order('layer_order', { ascending: true }),
    client
      .from('workspace_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (stickersRes.error) throw stickersRes.error;
  if (settingsRes.error) throw settingsRes.error;

  const fallbackSettings: WorkspaceSettings = {
    user_id: userId,
    display_name: 'Planner Owner',
    planner_mantra: 'A little progress goes a long way.',
    paper_tone: 'ivory',
    default_view: 'list',
    updated_at: new Date().toISOString(),
  };

  return {
    tasks: (tasksRes.data ?? []) as Task[],
    categories: (categoriesRes.data ?? []) as Category[],
    stickers: (stickersRes.data ?? []) as Sticker[],
    settings: (settingsRes.data as WorkspaceSettings | null) ?? fallbackSettings,
  };
}

export interface TaskInput {
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: Priority;
  category_id?: string | null;
  recurrence?: Recurrence;
}

export async function createTask(userId: string, input: TaskInput): Promise<Task> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  const { data, error } = await client
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      due_date: input.due_date || null,
      priority: input.priority ?? 'medium',
      category_id: input.category_id || null,
      recurrence: input.recurrence ?? 'none',
      is_completed: false,
      completed_at: null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
): Promise<Task> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Task>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  const { data, error } = await client
    .from('tasks')
    .update({
      ...updates,
      ...(typeof updates.title === 'string' ? { title: updates.title.trim() } : {}),
      ...(typeof updates.description === 'string'
        ? { description: updates.description.trim() }
        : {}),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Task;
}

export async function toggleTaskCompletion(
  userId: string,
  task: Task
): Promise<{ updatedTask: Task; nextRecurringTask: Task | null }> {
  const nextCompleted = !task.is_completed;
  const updatedTask = await updateTask(userId, task.id, {
    is_completed: nextCompleted,
    completed_at: nextCompleted ? new Date().toISOString() : null,
  });

  let nextRecurringTask: Task | null = null;
  if (nextCompleted && task.recurrence && task.recurrence !== 'none') {
    const nextDue = computeNextDueDate(task.due_date, task.recurrence);
    nextRecurringTask = await createTask(userId, {
      title: task.title,
      description: task.description,
      due_date: nextDue,
      priority: task.priority,
      category_id: task.category_id,
      recurrence: task.recurrence,
    });
  }

  return { updatedTask, nextRecurringTask };
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    await localApi(`/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
    return;
  }

  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function restoreDeletedTask(userId: string, task: Task): Promise<Task> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  const { data, error } = await client
    .from('tasks')
    .insert({
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      category_id: task.category_id,
      recurrence: task.recurrence,
      is_completed: task.is_completed,
      completed_at: task.completed_at,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Task;
}

export async function createCategory(
  userId: string,
  name: string,
  color: string
): Promise<Category> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), color }),
    });
  }

  const { data, error } = await client
    .from('categories')
    .insert({ user_id: userId, name: name.trim(), color })
    .select('*')
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: { name?: string; color?: string }
): Promise<Category> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Category>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  const { data, error } = await client
    .from('categories')
    .update({
      ...(typeof updates.name === 'string' ? { name: updates.name.trim() } : {}),
      ...(typeof updates.color === 'string' ? { color: updates.color } : {}),
    })
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    await localApi(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    });
    return;
  }

  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) throw error;
}

export interface StickerCreateInput {
  sticker_type: StickerType;
  custom_text?: string | null;
  x_position: number;
  y_position: number;
  rotation?: number;
  scale?: number;
  layer_order?: number;
}

export async function createSticker(
  userId: string,
  input: StickerCreateInput
): Promise<Sticker> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Sticker>('/stickers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  const { data, error } = await client
    .from('stickers')
    .insert({
      user_id: userId,
      sticker_type: input.sticker_type,
      custom_text: input.custom_text ?? null,
      x_position: input.x_position,
      y_position: input.y_position,
      rotation: input.rotation ?? 0,
      scale: input.scale ?? 1,
      layer_order: input.layer_order ?? 1,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Sticker;
}

export async function updateSticker(
  userId: string,
  stickerId: string,
  updates: Partial<
    Pick<
      Sticker,
      'x_position' | 'y_position' | 'rotation' | 'scale' | 'layer_order' | 'custom_text'
    >
  >
): Promise<Sticker> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<Sticker>(`/stickers/${encodeURIComponent(stickerId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  const { data, error } = await client
    .from('stickers')
    .update(updates)
    .eq('id', stickerId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Sticker;
}

export async function deleteSticker(userId: string, stickerId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    await localApi(`/stickers/${encodeURIComponent(stickerId)}`, {
      method: 'DELETE',
    });
    return;
  }

  const { error } = await client
    .from('stickers')
    .delete()
    .eq('id', stickerId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateWorkspaceSettings(
  userId: string,
  updates: Partial<
    Pick<WorkspaceSettings, 'display_name' | 'planner_mantra' | 'paper_tone' | 'default_view'>
  >
): Promise<WorkspaceSettings> {
  const client = getSupabaseClient();
  if (!client) {
    return localApi<WorkspaceSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  const { data, error } = await client
    .from('workspace_settings')
    .upsert(
      {
        user_id: userId,
        ...updates,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as WorkspaceSettings;
}
