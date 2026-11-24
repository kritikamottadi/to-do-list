-- Folio Personal Planner — Supabase PostgreSQL Schema & Row Level Security
-- Run this script in your Supabase Project -> SQL Editor.

create extension if not exists "pgcrypto";

-- 1. Categories Table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 48),
  color text not null default '#6D2E46',
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_user_id on public.categories(user_id);

-- 2. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text not null default '',
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category_id uuid references public.categories(id) on delete set null,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_due_date on public.tasks(user_id, due_date);

-- 3. Stickers Table (Scrapbook Workspace Decorations)
create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_type text not null,
  custom_text text,
  x_position double precision not null default 70,
  y_position double precision not null default 120,
  rotation double precision not null default 0,
  scale double precision not null default 1,
  layer_order integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_stickers_user_id on public.stickers(user_id);

-- 4. Workspace Settings Table (Personalization)
create table if not exists public.workspace_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Planner Owner',
  planner_mantra text not null default 'A little progress goes a long way.',
  paper_tone text not null default 'ivory' check (paper_tone in ('ivory', 'blush', 'sage')),
  default_view text not null default 'list' check (default_view in ('list', 'grid')),
  updated_at timestamptz not null default now()
);

-- 5. Automatic updated_at Trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_workspace_settings_updated_at on public.workspace_settings;
create trigger trg_workspace_settings_updated_at
  before update on public.workspace_settings
  for each row execute function public.set_updated_at();

-- 6. Seed Default Categories & Workspace Settings for New Users
create or replace function public.handle_new_planner_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_settings (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Planner Owner')
  )
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.categories where user_id = new.id) then
    insert into public.categories (user_id, name, color)
    values
      (new.id, 'College', '#6D2E46'),
      (new.id, 'Personal', '#C48291'),
      (new.id, 'Projects', '#6E8268'),
      (new.id, 'To-do', '#C7A23E'),
      (new.id, 'Events', '#8474A1');
  end if;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_folio on auth.users;
create trigger on_auth_user_created_folio
  after insert on auth.users
  for each row execute function public.handle_new_planner_user();

-- 7. Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.stickers enable row level security;
alter table public.workspace_settings enable row level security;

-- Categories RLS
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Tasks RLS
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Stickers RLS
create policy "Users can view own stickers"
  on public.stickers for select
  using (auth.uid() = user_id);

create policy "Users can create own stickers"
  on public.stickers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stickers"
  on public.stickers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own stickers"
  on public.stickers for delete
  using (auth.uid() = user_id);

-- Workspace Settings RLS
create policy "Users can view own workspace settings"
  on public.workspace_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own workspace settings"
  on public.workspace_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workspace settings"
  on public.workspace_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
