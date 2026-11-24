import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { isSupabaseConnected } from '../../lib/supabase';
import {
  ensureInitialUserData,
  fetchPlannerData,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  restoreDeletedTask,
  createCategory,
  updateCategory,
  deleteCategory,
  createSticker,
  updateSticker,
  deleteSticker,
  updateWorkspaceSettings,
  type TaskInput,
} from '../../lib/plannerService';
import {
  getLocalTodayISO,
  isDueTodayOrOverdue,
  isUpcomingDate,
} from '../../lib/dateUtils';
import type {
  Category,
  NavView,
  PlannerUser,
  Priority,
  SortField,
  StatusFilter,
  Sticker,
  StickerType,
  Task,
  ViewMode,
  WorkspaceSettings,
} from '../../types/planner';
import { Sidebar } from './Sidebar';
import { ProgressOverview } from './ProgressOverview';
import { SearchAndFilters } from './SearchAndFilters';
import { TaskList } from './TaskList';
import { TaskModal } from './TaskModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { SettingsModal } from './SettingsModal';
import { StickerCanvas } from '../stickers/StickerCanvas';
import { StickerTray } from '../stickers/StickerTray';
import { StickerGraphic, type StickerCatalogItem } from '../stickers/StickerArtwork';
import { ToastStack, type ToastItem } from '../ui/Toast';

interface PlannerWorkspaceProps {
  user: PlannerUser;
  onSignOut: () => Promise<void>;
}

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export const PlannerWorkspace: React.FC<PlannerWorkspaceProps> = ({ user, onSignOut }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>({
    user_id: user.id,
    display_name:
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Planner Owner',
    planner_mantra: 'A little progress goes a long way.',
    paper_tone: 'ivory',
    default_view: 'list',
    updated_at: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation & Filtering State
  const [activeView, setActiveView] = useState<NavView>('my-day');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortField>('due_date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Modals & Drawers
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [stickerTrayOpen, setStickerTrayOpen] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Active drag state for DragOverlay
  const [activeDrag, setActiveDrag] = useState<{
    stickerType: StickerType;
    customText?: string | null;
    rotation: number;
    scale: number;
  } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback(
    (message: string, options?: { undoLabel?: string; onUndo?: () => void }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, ...options }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load initial user data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await ensureInitialUserData(user);
      const data = await fetchPlannerData(user.id);
      setTasks(data.tasks);
      setCategories(data.categories);
      setStickers(data.stickers);
      setSettings(data.settings);
      setViewMode(data.settings.default_view);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load planner data from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // DnD Setup
  const canvasDomRef = useRef<HTMLDivElement | null>(null);
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'planner-canvas',
  });

  const combinedCanvasRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasDomRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { source: 'tray'; stickerType: StickerType; catalogItem: StickerCatalogItem }
      | { source: 'canvas'; sticker: Sticker }
      | undefined;
    if (!data) return;

    if (data.source === 'tray') {
      setActiveDrag({
        stickerType: data.stickerType,
        customText: data.catalogItem.defaultText ?? null,
        rotation: data.catalogItem.defaultRotation,
        scale: 1,
      });
    } else if (data.source === 'canvas') {
      setSelectedStickerId(data.sticker.id);
      setActiveDrag({
        stickerType: data.sticker.sticker_type,
        customText: data.sticker.custom_text,
        rotation: data.sticker.rotation,
        scale: data.sticker.scale,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const data = event.active.data.current as
      | { source: 'tray'; stickerType: StickerType; catalogItem: StickerCatalogItem }
      | { source: 'canvas'; sticker: Sticker }
      | undefined;
    const canvasEl = canvasDomRef.current;
    if (!data || !canvasEl) return;

    const canvasRect = canvasEl.getBoundingClientRect();

    if (data.source === 'tray') {
      const translated = event.active.rect.current.translated;
      if (!translated) return;

      const centerX = translated.left + translated.width / 2;
      const centerY = translated.top + translated.height / 2;

      const withinX = centerX >= canvasRect.left && centerX <= canvasRect.right;
      const withinY = centerY >= canvasRect.top && centerY <= canvasRect.bottom;
      if (!withinX || !withinY) return;

      const xPos = clamp(((centerX - canvasRect.left) / canvasRect.width) * 100, 5, 94);
      const yPos = clamp(
        centerY - canvasRect.top + canvasEl.scrollTop,
        40,
        Math.max(canvasEl.scrollHeight, 840) - 40
      );

      const maxLayer = stickers.reduce((m, s) => Math.max(m, s.layer_order), 0);
      await placeStickerAt(
        data.stickerType,
        xPos,
        yPos,
        data.catalogItem.defaultRotation,
        data.catalogItem.defaultText ?? null,
        maxLayer + 1
      );
    } else if (data.source === 'canvas') {
      const { delta } = event;
      if (delta.x === 0 && delta.y === 0) return;

      const s = data.sticker;
      const nextX = clamp(
        Number((s.x_position + (delta.x / canvasRect.width) * 100).toFixed(2)),
        3,
        96
      );
      const nextY = clamp(
        Math.round(s.y_position + delta.y),
        28,
        Math.max(canvasEl.scrollHeight, 840) - 28
      );

      setStickers((prev) =>
        prev.map((item) =>
          item.id === s.id ? { ...item, x_position: nextX, y_position: nextY } : item
        )
      );

      try {
        await updateSticker(user.id, s.id, { x_position: nextX, y_position: nextY });
      } catch {
        pushToast('Could not save sticker position.');
        setStickers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
      }
    }
  };

  const placeStickerAt = async (
    stickerType: StickerType,
    xPos: number,
    yPos: number,
    rotation: number,
    customText: string | null,
    layerOrder: number
  ) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Sticker = {
      id: tempId,
      user_id: user.id,
      sticker_type: stickerType,
      custom_text: customText,
      x_position: Number(xPos.toFixed(2)),
      y_position: Math.round(yPos),
      rotation,
      scale: 1,
      layer_order: layerOrder,
      created_at: new Date().toISOString(),
    };

    setStickers((prev) => [...prev, optimistic]);
    try {
      const saved = await createSticker(user.id, {
        sticker_type: stickerType,
        custom_text: customText,
        x_position: optimistic.x_position,
        y_position: optimistic.y_position,
        rotation,
        scale: 1,
        layer_order: layerOrder,
      });
      setStickers((prev) => prev.map((item) => (item.id === tempId ? saved : item)));
      setSelectedStickerId(saved.id);
      if (stickersLocked) setStickersLocked(false);
    } catch {
      setStickers((prev) => prev.filter((item) => item.id !== tempId));
      pushToast('Failed to place sticker.');
    }
  };

  const handleQuickPlaceSticker = async (item: StickerCatalogItem) => {
    const maxLayer = stickers.reduce((m, s) => Math.max(m, s.layer_order), 0);
    const offset = (stickers.length % 5) * 42;
    const xPos = 76 + ((stickers.length % 3) - 1) * 6;
    const yPos = 150 + offset;
    await placeStickerAt(
      item.type,
      xPos,
      yPos,
      item.defaultRotation,
      item.defaultText ?? null,
      maxLayer + 1
    );
    pushToast(`Placed ${item.label} on your page.`);
  };

  const handleUpdateStickerProps = async (
    stickerId: string,
    updates: Partial<
      Pick<Sticker, 'rotation' | 'scale' | 'layer_order' | 'custom_text'>
    >
  ) => {
    const prevSnapshot = stickers.find((s) => s.id === stickerId);
    setStickers((prev) =>
      prev.map((item) => (item.id === stickerId ? { ...item, ...updates } : item))
    );
    try {
      await updateSticker(user.id, stickerId, updates);
    } catch {
      if (prevSnapshot) {
        setStickers((prev) =>
          prev.map((item) => (item.id === stickerId ? prevSnapshot : item))
        );
      }
      pushToast('Could not update sticker.');
    }
  };

  const handleDeleteSticker = async (stickerId: string) => {
    const prevSnapshot = stickers.find((s) => s.id === stickerId);
    setStickers((prev) => prev.filter((s) => s.id !== stickerId));
    if (selectedStickerId === stickerId) setSelectedStickerId(null);
    try {
      await deleteSticker(user.id, stickerId);
      pushToast('Sticker removed.');
    } catch {
      if (prevSnapshot) {
        setStickers((prev) => [...prev, prevSnapshot]);
      }
      pushToast('Could not remove sticker.');
    }
  };

  // Task CRUD Handlers
  const handleQuickAddTask = async (title: string) => {
    const defaultDue = activeView === 'my-day' ? getLocalTodayISO() : null;
    const defaultCat = selectedCategoryId || (filterCategoryId !== 'all' ? filterCategoryId : null);
    try {
      const created = await createTask(user.id, {
        title,
        due_date: defaultDue,
        priority: 'medium',
        category_id: defaultCat,
        recurrence: 'none',
      });
      setTasks((prev) => [created, ...prev]);
      pushToast('Task added to your page.');
    } catch {
      pushToast('Unable to save task.');
    }
  };

  const handleSaveTaskModal = async (input: TaskInput, editingTaskId?: string) => {
    if (editingTaskId) {
      const updated = await updateTask(user.id, editingTaskId, input);
      setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
      pushToast('Task updated.');
    } else {
      const created = await createTask(user.id, input);
      setTasks((prev) => [created, ...prev]);
      pushToast('Task created.');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const prevCompleted = task.is_completed;
    const optimisticDone = !prevCompleted;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              is_completed: optimisticDone,
              completed_at: optimisticDone ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const { updatedTask, nextRecurringTask } = await toggleTaskCompletion(user.id, task);
      setTasks((prev) => {
        const mapped = prev.map((t) => (t.id === task.id ? updatedTask : t));
        return nextRecurringTask ? [nextRecurringTask, ...mapped] : mapped;
      });

      if (optimisticDone) {
        pushToast(
          nextRecurringTask
            ? `Completed! Next ${task.recurrence} occurrence scheduled.`
            : `"${task.title}" completed.`,
          {
            undoLabel: 'Undo',
            onUndo: async () => {
              const reverted = await updateTask(user.id, task.id, {
                is_completed: false,
                completed_at: null,
              });
              setTasks((prev) => prev.map((t) => (t.id === task.id ? reverted : t)));
            },
          }
        );
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      pushToast('Could not update task status.');
    }
  };

  const handleQuickPriorityChange = async (task: Task, nextPriority: Priority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority: nextPriority } : t))
    );
    try {
      const updated = await updateTask(user.id, task.id, { priority: nextPriority });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      pushToast('Could not update priority.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await deleteTask(user.id, task.id);
      pushToast(`Removed "${task.title}".`, {
        undoLabel: 'Undo',
        onUndo: async () => {
          try {
            const restored = await restoreDeletedTask(user.id, task);
            setTasks((prev) => [restored, ...prev]);
          } catch {
            pushToast('Could not restore task.');
          }
        },
      });
    } catch {
      setTasks((prev) => [task, ...prev]);
      pushToast('Could not delete task.');
    }
  };

  // Category CRUD Handlers
  const handleCreateCategory = async (name: string, color: string) => {
    const created = await createCategory(user.id, name, color);
    setCategories((prev) => [...prev, created]);
    pushToast(`Created "${created.name}" collection.`);
  };

  const handleUpdateCategory = async (
    id: string,
    updates: { name?: string; color?: string }
  ) => {
    const updated = await updateCategory(user.id, id, updates);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    pushToast('Collection updated.');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(user.id, id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) =>
      prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t))
    );
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    if (filterCategoryId === id) setFilterCategoryId('all');
    pushToast('Collection removed.');
  };

  // Workspace Settings Handlers
  const handleSaveSettings = async (
    updates: Partial<
      Pick<WorkspaceSettings, 'display_name' | 'planner_mantra' | 'paper_tone' | 'default_view'>
    >
  ) => {
    const saved = await updateWorkspaceSettings(user.id, updates);
    setSettings(saved);
    if (updates.default_view) {
      setViewMode(updates.default_view);
    }
    pushToast('Planner preferences saved.');
  };

  // Derived Counts & Filtered Tasks
  const todayISO = getLocalTodayISO();

  const counts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let myDay = 0;
    let upcoming = 0;
    let all = 0;
    let completed = 0;

    for (const t of tasks) {
      if (t.is_completed) {
        completed += 1;
      } else {
        all += 1;
        if (isDueTodayOrOverdue(t.due_date)) myDay += 1;
        if (isUpcomingDate(t.due_date)) upcoming += 1;
        if (t.category_id) {
          byCategory[t.category_id] = (byCategory[t.category_id] ?? 0) + 1;
        }
      }
    }

    return { myDay, upcoming, all, completed, byCategory };
  }, [tasks]);

  const todayStats = useMemo(() => {
    const todayTasks = tasks.filter(
      (t) => t.due_date === todayISO || (!t.is_completed && isDueTodayOrOverdue(t.due_date))
    );
    const done = todayTasks.filter((t) => t.is_completed).length;
    return {
      todayTotal: todayTasks.length,
      todayCompleted: done,
    };
  }, [tasks, todayISO]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tasks
      .filter((task) => {
        // Sidebar Collection overrides view filter unless completed view selected
        if (selectedCategoryId) {
          if (task.category_id !== selectedCategoryId) return false;
        } else {
          if (activeView === 'my-day') {
            const belongsToday =
              task.due_date === todayISO || (!task.is_completed && isDueTodayOrOverdue(task.due_date));
            if (!belongsToday) return false;
          } else if (activeView === 'upcoming') {
            if (!isUpcomingDate(task.due_date)) return false;
          } else if (activeView === 'completed') {
            if (!task.is_completed) return false;
          }
        }

        // Toolbar filters
        if (filterCategoryId !== 'all' && task.category_id !== filterCategoryId) {
          return false;
        }
        if (filterPriority !== 'all' && task.priority !== filterPriority) {
          return false;
        }
        if (filterStatus === 'active' && task.is_completed) return false;
        if (filterStatus === 'completed' && !task.is_completed) return false;

        if (q) {
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = (task.description ?? '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Always keep incomplete items above completed items in mixed lists
        if (a.is_completed !== b.is_completed) {
          return a.is_completed ? 1 : -1;
        }

        if (sortBy === 'priority') {
          const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          if (diff !== 0) return diff;
        }

        if (sortBy === 'due_date') {
          if (a.due_date && b.due_date) {
            const cmp = a.due_date.localeCompare(b.due_date);
            if (cmp !== 0) return cmp;
          } else if (a.due_date && !b.due_date) {
            return -1;
          } else if (!a.due_date && b.due_date) {
            return 1;
          }
        }

        return b.created_at.localeCompare(a.created_at);
      });
  }, [
    tasks,
    activeView,
    selectedCategoryId,
    filterCategoryId,
    filterPriority,
    filterStatus,
    searchQuery,
    sortBy,
    todayISO,
  ]);

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? null;

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterCategoryId !== 'all' ||
    filterPriority !== 'all' ||
    filterStatus !== 'all';

  const paperClass =
    settings.paper_tone === 'blush'
      ? 'paper-blush'
      : settings.paper_tone === 'sage'
      ? 'paper-sage'
      : 'paper-ivory';

  const showDailyCelebration =
    activeView === 'my-day' &&
    !selectedCategoryId &&
    todayStats.todayTotal > 0 &&
    todayStats.todayCompleted === todayStats.todayTotal;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`${paperClass} paper-grain flex h-screen w-full overflow-hidden text-[#2B211D]`}>
        <Sidebar
          activeView={activeView}
          selectedCategoryId={selectedCategoryId}
          categories={categories}
          counts={counts}
          userEmail={user.email ?? ''}
          displayName={settings.display_name}
          isSupabaseMode={isSupabaseConnected()}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSelectView={setActiveView}
          onSelectCategory={setSelectedCategoryId}
          onOpenCategoryManager={() => setCategoryModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onSignOut={onSignOut}
        />

        {/* Scrollable Workspace & Sticker Drop Canvas */}
        <main
          ref={combinedCanvasRef}
          onClick={() => setSelectedStickerId(null)}
          className="relative flex-1 overflow-y-auto"
        >
          {/* Interactive Scrapbook Stickers Layer */}
          <StickerCanvas
            stickers={stickers}
            selectedStickerId={selectedStickerId}
            locked={stickersLocked}
            onSelectSticker={setSelectedStickerId}
            onUpdateSticker={handleUpdateStickerProps}
            onDeleteSticker={handleDeleteSticker}
          />

          <div className="relative z-20 mx-auto max-w-5xl px-5 sm:px-10 lg:px-12">
            <ProgressOverview
              activeView={activeView}
              selectedCategory={selectedCategory}
              mantra={settings.planner_mantra}
              pendingCount={counts.all}
              completedCount={counts.completed}
              todayCompleted={todayStats.todayCompleted}
              todayTotal={todayStats.todayTotal}
              stickerCount={stickers.length}
              onSaveMantra={(nextMantra) => handleSaveSettings({ planner_mantra: nextMantra })}
              onOpenNewTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onToggleStickerTray={() => setStickerTrayOpen((prev) => !prev)}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            />

            {loadError && (
              <div className="mt-5 flex items-center justify-between gap-4 border border-[#8E354A]/30 bg-[#F4E7EA] px-4 py-3 text-xs text-[#6D2E46]">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={loadData}
                  className="font-medium underline underline-offset-4 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <SearchAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categories={categories}
              filterCategoryId={filterCategoryId}
              onFilterCategoryChange={setFilterCategoryId}
              filterPriority={filterPriority}
              onFilterPriorityChange={setFilterPriority}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onQuickAdd={handleQuickAddTask}
            />

            <TaskList
              tasks={filteredTasks}
              categories={categories}
              viewMode={viewMode}
              activeView={activeView}
              selectedCategory={selectedCategory}
              hasActiveFilters={hasActiveFilters}
              showDailyCelebration={showDailyCelebration}
              loading={loading}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onQuickPriorityChange={handleQuickPriorityChange}
              onOpenNewTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onResetFilters={() => {
                setSearchQuery('');
                setFilterCategoryId('all');
                setFilterPriority('all');
                setFilterStatus('all');
              }}
            />
          </div>
        </main>

        {/* Sticker Tray Drawer */}
        <StickerTray
          isOpen={stickerTrayOpen}
          onClose={() => setStickerTrayOpen(false)}
          onQuickPlace={handleQuickPlaceSticker}
          placedCount={stickers.length}
          stickersLocked={stickersLocked}
          onToggleLock={() => setStickersLocked((prev) => !prev)}
        />

        {/* DragOverlay with lifted tilt animation */}
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div
              style={{
                transform: `rotate(${activeDrag.rotation - 4}deg) scale(${
                  activeDrag.scale * 1.06
                })`,
              }}
              className="pointer-events-none drop-shadow-[0_12px_20px_rgba(43,33,29,0.18)]"
            >
              <StickerGraphic
                type={activeDrag.stickerType}
                customText={activeDrag.customText}
              />
            </div>
          ) : null}
        </DragOverlay>

        {/* Modals */}
        <TaskModal
          isOpen={taskModalOpen}
          editingTask={editingTask}
          categories={categories}
          defaultCategoryId={selectedCategoryId}
          defaultDueDate={activeView === 'my-day' ? todayISO : null}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTaskModal}
        />

        <CategoryManagerModal
          isOpen={categoryModalOpen}
          categories={categories}
          onClose={() => setCategoryModalOpen(false)}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />

        <SettingsModal
          isOpen={settingsModalOpen}
          settings={settings}
          onClose={() => setSettingsModalOpen(false)}
          onSave={handleSaveSettings}
        />

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </DndContext>
  );
};
