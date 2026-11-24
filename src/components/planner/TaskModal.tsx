import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Category, Priority, Recurrence, Task } from '../../types/planner';
import type { TaskInput } from '../../lib/plannerService';
import { getLocalTodayISO } from '../../lib/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  categories: Category[];
  defaultCategoryId?: string | null;
  defaultDueDate?: string | null;
  onClose: () => void;
  onSubmit: (input: TaskInput, editingTaskId?: string) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  editingTask,
  categories,
  defaultCategoryId,
  defaultDueDate,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? '');
      setDueDate(editingTask.due_date ?? '');
      setPriority(editingTask.priority);
      setCategoryId(editingTask.category_id ?? '');
      setRecurrence(editingTask.recurrence ?? 'none');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(defaultDueDate ?? '');
      setPriority('medium');
      setCategoryId(defaultCategoryId ?? '');
      setRecurrence('none');
    }
  }, [isOpen, editingTask, defaultCategoryId, defaultDueDate]);

  if (!isOpen) return null;

  const setTomorrow = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setDueDate(`${y}-${m}-${d}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate || null,
          priority,
          category_id: categoryId || null,
          recurrence,
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241915]/40 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg border border-[#2B211D]/15 bg-[#FFFDF9] shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-[#2B211D]/10 px-6 py-4">
          <div>
            <p className="font-mono text-[11px] text-[#8C7B72] uppercase">
              {editingTask ? 'Edit Entry' : 'New Entry'}
            </p>
            <h2
              id="task-modal-heading"
              className="font-serif text-2xl font-medium text-[#2B211D]"
            >
              {editingTask ? 'Update task details' : 'Write a new task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-[#5A4A42]">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              maxLength={220}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft typography essay outline"
              className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm text-[#2B211D] placeholder:text-[#9A8A80] focus:border-[#6D2E46] focus:bg-[#FFFDF9] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="task-notes" className="block text-xs font-medium text-[#5A4A42]">
              Notes &amp; details
            </label>
            <textarea
              id="task-notes"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context, links, or smaller steps..."
              className="mt-1.5 w-full resize-none border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3.5 py-2 text-sm text-[#2B211D] placeholder:text-[#9A8A80] focus:border-[#6D2E46] focus:bg-[#FFFDF9] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="task-due" className="block text-xs font-medium text-[#5A4A42]">
                  Due date
                </label>
                <div className="flex items-center gap-2 text-[11px] text-[#6D2E46]">
                  <button
                    type="button"
                    onClick={() => setDueDate(getLocalTodayISO())}
                    className="hover:underline"
                  >
                    Today
                  </button>
                  <button type="button" onClick={setTomorrow} className="hover:underline">
                    Tomorrow
                  </button>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="text-[#8C7B72] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3 py-2 text-xs text-[#2B211D] focus:border-[#6D2E46] focus:bg-[#FFFDF9] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="task-category" className="block text-xs font-medium text-[#5A4A42]">
                Collection
              </label>
              <select
                id="task-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3 py-2 text-xs text-[#2B211D] focus:border-[#6D2E46] focus:bg-[#FFFDF9] focus:outline-none"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-[#5A4A42]">Priority</span>
              <div className="mt-1.5 grid grid-cols-3 border border-[#2B211D]/15 bg-[#F3EDE3] p-0.5">
                {(['low', 'medium', 'high'] as Priority[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`py-1.5 text-xs font-medium capitalize transition-colors ${
                      priority === level
                        ? 'bg-[#FFFDF9] text-[#6D2E46] shadow-xs'
                        : 'text-[#5A4A42] hover:text-[#2B211D]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="task-recurrence" className="block text-xs font-medium text-[#5A4A42]">
                Repeat
              </label>
              <select
                id="task-recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3 py-2 text-xs text-[#2B211D] focus:border-[#6D2E46] focus:bg-[#FFFDF9] focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="bg-[#F4E7EA] px-3 py-2 text-xs text-[#6D2E46]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-[#2B211D]/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#2B211D]/15 bg-[#FAF6F0] px-4 py-2 text-xs font-medium text-[#4A3B34] hover:bg-[#F3EDE3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#6D2E46] px-5 py-2 text-xs font-medium text-[#FFFDF9] hover:bg-[#562336] disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
