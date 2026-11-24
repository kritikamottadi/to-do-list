import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';

interface LocalUserRecord {
  id: string;
  email: string;
  full_name: string;
  password_salt: string;
  password_hash: string;
  created_at: string;
}

interface LocalCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

interface LocalTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  category_id: string | null;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LocalSticker {
  id: string;
  user_id: string;
  sticker_type: string;
  custom_text: string | null;
  x_position: number;
  y_position: number;
  rotation: number;
  scale: number;
  layer_order: number;
  created_at: string;
}

interface LocalWorkspaceSettings {
  user_id: string;
  display_name: string;
  planner_mantra: string;
  paper_tone: 'ivory' | 'blush' | 'sage';
  default_view: 'list' | 'grid';
  updated_at: string;
}

interface LocalPreviewStore {
  users: LocalUserRecord[];
  categories: LocalCategory[];
  tasks: LocalTask[];
  stickers: LocalSticker[];
  settings: LocalWorkspaceSettings[];
}

const STORE_PATH = path.resolve(process.cwd(), '.folio-preview-data.json');

const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'College', color: '#6D2E46' },
  { name: 'Personal', color: '#C48291' },
  { name: 'Projects', color: '#6E8268' },
  { name: 'To-do', color: '#C7A23E' },
  { name: 'Events', color: '#8474A1' },
];

// In-memory session token store for Local Preview Mode (Bearer tokens)
const activeSessions = new Map<string, string>();

function readStore(): LocalPreviewStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LocalPreviewStore>;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        stickers: Array.isArray(parsed.stickers) ? parsed.stickers : [],
        settings: Array.isArray(parsed.settings) ? parsed.settings : [],
      };
    }
  } catch {
    // Fall back to empty store if file is unreadable
  }
  return { users: [], categories: [], tasks: [], stickers: [], settings: [] };
}

function writeStore(store: LocalPreviewStore): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHashHex: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHashHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getSupabasePublicConfig() {
  const url = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isPlaceholder =
    !url ||
    !anonKey ||
    url.includes('your-project-id') ||
    anonKey.includes('your-supabase-anon');

  const configured = !isPlaceholder && /^https?:\/\//i.test(url);

  return {
    supabaseConfigured: configured,
    supabaseUrl: configured ? url : null,
    supabaseAnonKey: configured ? anonKey : null,
  };
}

interface AuthedRequest extends Request {
  localUserId?: string;
}

function requireLocalAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const userId = activeSessions.get(token);
  if (!userId) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  req.localUserId = userId;
  next();
}

function toPublicUser(u: LocalUserRecord) {
  return {
    id: u.id,
    email: u.email,
    user_metadata: { full_name: u.full_name },
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public Supabase runtime config check (never exposes service_role key)
  app.get('/api/config', (_req, res) => {
    res.json(getSupabasePublicConfig());
  });

  // Local Preview Auth Routes (used only when Supabase credentials are not configured)
  app.post('/api/local-auth/signup', (req, res) => {
    const body = req.body as { email?: unknown; password?: unknown; full_name?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rawName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const store = readStore();
    if (store.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
      return;
    }

    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    const fullName = rawName.slice(0, 64) || email.split('@')[0];
    const { salt, hash } = hashPassword(password);

    const newUser: LocalUserRecord = {
      id: userId,
      email,
      full_name: fullName,
      password_salt: salt,
      password_hash: hash,
      created_at: now,
    };

    store.users.push(newUser);
    store.settings.push({
      user_id: userId,
      display_name: fullName,
      planner_mantra: 'A little progress goes a long way.',
      paper_tone: 'ivory',
      default_view: 'list',
      updated_at: now,
    });
    for (const cat of DEFAULT_CATEGORIES) {
      store.categories.push({
        id: crypto.randomUUID(),
        user_id: userId,
        name: cat.name,
        color: cat.color,
        created_at: now,
      });
    }
    writeStore(store);

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, userId);

    res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/local-auth/signin', (req, res) => {
    const body = req.body as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const store = readStore();
    const user = store.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, user.id);

    res.json({ token, user: toPublicUser(user) });
  });

  app.post('/api/local-auth/signout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) activeSessions.delete(token);
    res.json({ ok: true });
  });

  // Protected Local Preview Planner CRUD Routes
  app.get('/api/local-planner/data', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const store = readStore();
    const user = store.users.find((u) => u.id === userId);

    let userSettings = store.settings.find((s) => s.user_id === userId);
    if (!userSettings) {
      userSettings = {
        user_id: userId,
        display_name: user?.full_name || 'Planner Owner',
        planner_mantra: 'A little progress goes a long way.',
        paper_tone: 'ivory',
        default_view: 'list',
        updated_at: new Date().toISOString(),
      };
      store.settings.push(userSettings);
      writeStore(store);
    }

    res.json({
      tasks: store.tasks
        .filter((t) => t.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      categories: store.categories
        .filter((c) => c.user_id === userId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      stickers: store.stickers
        .filter((s) => s.user_id === userId)
        .sort((a, b) => a.layer_order - b.layer_order),
      settings: userSettings,
    });
  });

  app.post('/api/local-planner/tasks', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 240) {
      res.status(400).json({ error: 'Task title is required (max 240 chars).' });
      return;
    }

    const priority =
      body.priority === 'low' || body.priority === 'high' ? body.priority : 'medium';
    const recurrence =
      body.recurrence === 'daily' ||
      body.recurrence === 'weekly' ||
      body.recurrence === 'monthly'
        ? body.recurrence
        : 'none';
    const now = new Date().toISOString();

    const task: LocalTask = {
      id: typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID(),
      user_id: userId,
      title,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '',
      due_date: typeof body.due_date === 'string' && body.due_date ? body.due_date : null,
      priority,
      category_id: typeof body.category_id === 'string' && body.category_id ? body.category_id : null,
      recurrence,
      is_completed: Boolean(body.is_completed),
      completed_at: typeof body.completed_at === 'string' ? body.completed_at : null,
      created_at: now,
      updated_at: now,
    };

    const store = readStore();
    store.tasks.push(task);
    writeStore(store);
    res.status(201).json(task);
  });

  app.patch('/api/local-planner/tasks/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const store = readStore();
    const idx = store.tasks.findIndex((t) => t.id === id && t.user_id === userId);
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const existing = store.tasks[idx];
    const updated: LocalTask = {
      ...existing,
      ...(typeof body.title === 'string' && body.title.trim()
        ? { title: body.title.trim().slice(0, 240) }
        : {}),
      ...(typeof body.description === 'string'
        ? { description: body.description.trim().slice(0, 2000) }
        : {}),
      ...(body.due_date === null || typeof body.due_date === 'string'
        ? { due_date: body.due_date || null }
        : {}),
      ...(body.priority === 'low' || body.priority === 'medium' || body.priority === 'high'
        ? { priority: body.priority }
        : {}),
      ...(body.category_id === null || typeof body.category_id === 'string'
        ? { category_id: body.category_id || null }
        : {}),
      ...(body.recurrence === 'none' ||
      body.recurrence === 'daily' ||
      body.recurrence === 'weekly' ||
      body.recurrence === 'monthly'
        ? { recurrence: body.recurrence }
        : {}),
      ...(typeof body.is_completed === 'boolean' ? { is_completed: body.is_completed } : {}),
      ...(body.completed_at === null || typeof body.completed_at === 'string'
        ? { completed_at: body.completed_at }
        : {}),
      updated_at: new Date().toISOString(),
    };

    store.tasks[idx] = updated;
    writeStore(store);
    res.json(updated);
  });

  app.delete('/api/local-planner/tasks/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const store = readStore();
    store.tasks = store.tasks.filter((t) => !(t.id === id && t.user_id === userId));
    writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/local-planner/categories', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const color = typeof body.color === 'string' ? body.color.trim() : '#6D2E46';
    if (!name || name.length > 48) {
      res.status(400).json({ error: 'Collection name is required.' });
      return;
    }

    const category: LocalCategory = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      color,
      created_at: new Date().toISOString(),
    };

    const store = readStore();
    store.categories.push(category);
    writeStore(store);
    res.status(201).json(category);
  });

  app.patch('/api/local-planner/categories/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const store = readStore();
    const idx = store.categories.findIndex((c) => c.id === id && c.user_id === userId);
    if (idx === -1) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    const updated: LocalCategory = {
      ...store.categories[idx],
      ...(typeof body.name === 'string' && body.name.trim()
        ? { name: body.name.trim().slice(0, 48) }
        : {}),
      ...(typeof body.color === 'string' && body.color.trim() ? { color: body.color.trim() } : {}),
    };
    store.categories[idx] = updated;
    writeStore(store);
    res.json(updated);
  });

  app.delete('/api/local-planner/categories/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const store = readStore();
    store.categories = store.categories.filter((c) => !(c.id === id && c.user_id === userId));
    store.tasks = store.tasks.map((t) =>
      t.user_id === userId && t.category_id === id ? { ...t, category_id: null } : t
    );
    writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/local-planner/stickers', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const body = req.body as Record<string, unknown>;
    const stickerType = typeof body.sticker_type === 'string' ? body.sticker_type.trim() : '';
    if (!stickerType) {
      res.status(400).json({ error: 'Sticker type is required.' });
      return;
    }

    const sticker: LocalSticker = {
      id: crypto.randomUUID(),
      user_id: userId,
      sticker_type: stickerType,
      custom_text: typeof body.custom_text === 'string' ? body.custom_text.slice(0, 120) : null,
      x_position: typeof body.x_position === 'number' ? body.x_position : 70,
      y_position: typeof body.y_position === 'number' ? body.y_position : 120,
      rotation: typeof body.rotation === 'number' ? body.rotation : 0,
      scale: typeof body.scale === 'number' ? body.scale : 1,
      layer_order: typeof body.layer_order === 'number' ? body.layer_order : 1,
      created_at: new Date().toISOString(),
    };

    const store = readStore();
    store.stickers.push(sticker);
    writeStore(store);
    res.status(201).json(sticker);
  });

  app.patch('/api/local-planner/stickers/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const store = readStore();
    const idx = store.stickers.findIndex((s) => s.id === id && s.user_id === userId);
    if (idx === -1) {
      res.status(404).json({ error: 'Sticker not found.' });
      return;
    }

    const updated: LocalSticker = {
      ...store.stickers[idx],
      ...(typeof body.x_position === 'number' ? { x_position: body.x_position } : {}),
      ...(typeof body.y_position === 'number' ? { y_position: body.y_position } : {}),
      ...(typeof body.rotation === 'number' ? { rotation: body.rotation } : {}),
      ...(typeof body.scale === 'number' ? { scale: body.scale } : {}),
      ...(typeof body.layer_order === 'number' ? { layer_order: body.layer_order } : {}),
      ...(body.custom_text === null || typeof body.custom_text === 'string'
        ? { custom_text: body.custom_text ? body.custom_text.slice(0, 120) : null }
        : {}),
    };

    store.stickers[idx] = updated;
    writeStore(store);
    res.json(updated);
  });

  app.delete('/api/local-planner/stickers/:id', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const { id } = req.params;
    const store = readStore();
    store.stickers = store.stickers.filter((s) => !(s.id === id && s.user_id === userId));
    writeStore(store);
    res.json({ ok: true });
  });

  app.put('/api/local-planner/settings', requireLocalAuth, (req: AuthedRequest, res) => {
    const userId = req.localUserId!;
    const body = req.body as Record<string, unknown>;
    const store = readStore();
    const idx = store.settings.findIndex((s) => s.user_id === userId);
    const now = new Date().toISOString();

    const base: LocalWorkspaceSettings =
      idx >= 0
        ? store.settings[idx]
        : {
            user_id: userId,
            display_name: 'Planner Owner',
            planner_mantra: 'A little progress goes a long way.',
            paper_tone: 'ivory',
            default_view: 'list',
            updated_at: now,
          };

    const updated: LocalWorkspaceSettings = {
      ...base,
      ...(typeof body.display_name === 'string' && body.display_name.trim()
        ? { display_name: body.display_name.trim().slice(0, 64) }
        : {}),
      ...(typeof body.planner_mantra === 'string' && body.planner_mantra.trim()
        ? { planner_mantra: body.planner_mantra.trim().slice(0, 120) }
        : {}),
      ...(body.paper_tone === 'ivory' ||
      body.paper_tone === 'blush' ||
      body.paper_tone === 'sage'
        ? { paper_tone: body.paper_tone }
        : {}),
      ...(body.default_view === 'list' || body.default_view === 'grid'
        ? { default_view: body.default_view }
        : {}),
      updated_at: now,
    };

    if (idx >= 0) {
      store.settings[idx] = updated;
    } else {
      store.settings.push(updated);
    }
    writeStore(store);
    res.json(updated);
  });

  // Vite middleware in development, static dist serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Folio planner server listening on http://0.0.0.0:3000');
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
