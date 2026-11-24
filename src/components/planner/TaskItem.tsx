import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Repeat, Trash2 } from 'lucide-react';
import type { Category, Priority, Task, ViewMode } from '../../types/planner';
import { formatShortDueDate, isOverdueDate } from '../../lib/dateUtils';

interface TaskItemProps {
  task: Task;
  category?: Category;
  viewMode: ViewMode;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onQuickPriorityChange: (task: Task, nextPriority: Priority) => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: '#8E354A' },
  medium: { label: 'Medium', color: '#B28B2E' },
  low: { label: 'Low', color: '#6E8268' },
};

const NEXT_PRIORITY: Record<Priority, Priority> = {
  low: 'medium',
  medium: 'high',
  high: 'low',
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  viewMode,
  onToggleComplete,
  onEdit,
  onDelete,
  onQuickPriorityChange,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dueLabel = formatShortDueDate(task.due_date);
  const overdue = isOverdueDate(task.due_date, task.is_completed);
  const priorityMeta = PRIORITY_STYLES[task.priority];

  const checkbox = (
    <button
      type="button"
      onClick={() => onToggleComplete(task)}
      aria-label={task.is_completed ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
      aria-pressed={task.is_completed}
      className={`group/check relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#6D2E46] ${
        task.is_completed
          ? 'border-[#6D2E46] bg-[#6D2E46] text-[#FFFDF9]'
          : 'border-[#2B211D]/30 bg-[#FFFDF9] hover:border-[#6D2E46]'
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
        <motion.path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{
            pathLength: task.is_completed ? 1 : 0,
            opacity: task.is_completed ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </button>
  );

  const metadataRow = (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B5A52]">
      {category && (
        <>
          <span className="inline-flex items-center gap-1.5 text-[#4A3B34]">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
            <span>{category.name}</span>
          </span>
          <span aria-hidden="true" className="text-[#B8AA9E]">
            ·
          </span>
        </>
      )}

      <button
        type="button"
        onClick={() => onQuickPriorityChange(task, NEXT_PRIORITY[task.priority])}
        title="Click to cycle priority"
        className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
        style={{ color: priorityMeta.color }}
      >
        <span>{priorityMeta.label}</span>
      </button>

      {dueLabel && (
        <>
          <span aria-hidden="true" className="text-[#B8AA9E]">
            ·
          </span>
          <span
            className={`font-mono text-[11px] tabular-nums ${
              overdue ? 'font-medium text-[#8E354A]' : 'text-[#6B5A52]'
            }`}
          >
            {overdue ? `Overdue (${dueLabel})` : dueLabel}
          </span>
        </>
      )}

      {task.recurrence !== 'none' && (
        <>
          <span aria-hidden="true" className="text-[#B8AA9E]">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] capitalize text-[#6B5A52]">
            <Repeat className="h-3 w-3" />
            <span>{task.recurrence}</span>
          </span>
        </>
      )}
    </div>
  );

  const actionControls = (
    <div className="flex items-center gap-1 shrink-0">
      {confirmingDelete ? (
        <div className="flex items-center gap-1 bg-[#F4E7EA] px-2 py-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setConfirmingDelete(false);
              onDelete(task);
            }}
            className="font-medium text-[#6D2E46] hover:underline"
          >
            Delete
          </button>
          <span className="text-[#B8AA9E]">/</span>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="text-[#5A4A42] hover:text-[#2B211D]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex h-8 w-8 items-center justify-center rounded text-[#7C6A61] transition-colors hover:bg-[#F3EDE3] hover:text-[#2B211D] focus-visible:outline-2 focus-visible:outline-[#6D2E46]"
            title="Edit task"
            aria-label={`Edit "${task.title}"`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded text-[#7C6A61] transition-colors hover:bg-[#F4E7EA] hover:text-[#8E354A] focus-visible:outline-2 focus-visible:outline-[#6D2E46]"
            title="Delete task"
            aria-label={`Delete "${task.title}"`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`group relative flex flex-col justify-between border border-[#2B211D]/11 bg-[#FFFDF9] p-5 transition-colors hover:border-[#2B211D]/22 ${
          task.is_completed ? 'bg-[#FAF6F0]/75 opacity-75' : ''
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {checkbox}
              <button
                type="button"
                onClick={() => onEdit(task)}
                className={`min-w-0 flex-1 text-left text-[15px] font-medium leading-snug text-[#2B211D] hover:text-[#6D2E46] ${
                  task.is_completed ? 'line-through text-[#8C7B72]' : ''
                }`}
              >
                {task.title}
              </button>
            </div>
          </div>

          {task.description && (
            <p className="mt-2.5 line-clamp-3 pl-8 text-xs leading-relaxed text-[#6B5A52]">
              {task.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-[#2B211D]/8 pt-3 pl-8">
          <div className="min-w-0 flex-1">{metadataRow}</div>
          <div className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            {actionControls}
          </div>
        </div>
      </motion.article>
    );
  }

  // Editorial Ledger List Row
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex items-start justify-between gap-4 border-b border-[#2B211D]/10 px-3 py-4 transition-colors hover:bg-[#FFFDF9]/80 ${
        task.is_completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {checkbox}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className={`text-left text-[15px] font-medium leading-snug text-[#2B211D] transition-colors hover:text-[#6D2E46] ${
              task.is_completed ? 'line-through text-[#8C7B72]' : ''
            }`}
          >
            {task.title}
          </button>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6B5A52]">
              {task.description}
            </p>
          )}

          {metadataRow}
        </div>
      </div>

      <div className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {actionControls}
      </div>
    </motion.div>
  );
};
