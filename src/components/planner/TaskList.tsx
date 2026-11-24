import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import type { Category, NavView, Priority, Task, ViewMode } from '../../types/planner';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  viewMode: ViewMode;
  activeView: NavView;
  selectedCategory: Category | null;
  hasActiveFilters: boolean;
  showDailyCelebration: boolean;
  loading: boolean;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onQuickPriorityChange: (task: Task, nextPriority: Priority) => void;
  onOpenNewTask: () => void;
  onResetFilters: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  viewMode,
  activeView,
  selectedCategory,
  hasActiveFilters,
  showDailyCelebration,
  loading,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onQuickPriorityChange,
  onOpenNewTask,
  onResetFilters,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="h-16 animate-pulse border-b border-[#2B211D]/8 bg-[#F3EDE3]/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Gentle Celebration when all My Day tasks are complete */}
      <AnimatePresence>
        {showDailyCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center justify-between gap-4 border border-[#6E8268]/30 bg-[#E8EFE5]/70 px-5 py-4"
          >
            <div>
              <p className="font-serif text-lg font-medium text-[#2F3D2B]">
                Today&apos;s page is complete.
              </p>
              <p className="font-hand text-xl text-[#4D6147]">
                Take a quiet breath — everything scheduled for today is checked off.
              </p>
            </div>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="shrink-0">
              <path
                d="M22 6C23.2 15.5 26 18.2 35 19.5C26 20.8 23.2 23.5 22 33C20.8 23.5 18 20.8 9 19.5C18 18.2 20.8 15.5 22 6Z"
                fill="#EBD58C"
                stroke="#53654E"
                strokeWidth="1.4"
              />
              <circle cx="34" cy="32" r="2.2" fill="#D8A7B1" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center border border-dashed border-[#2B211D]/18 bg-[#FFFDF9]/65 px-6 py-14 text-center">
          {/* Custom Stationery Open Notebook SVG */}
          <svg
            width="84"
            height="68"
            viewBox="0 0 84 68"
            fill="none"
            className="mb-4 text-[#6D2E46]"
          >
            <path
              d="M12 16C12 13.8 13.8 12 16 12H38C40.2 12 42 13.8 42 16V54C42 54 35 51 27 51C19 51 12 54 12 54V16Z"
              fill="#FAF6F0"
              stroke="#6F5446"
              strokeWidth="1.5"
            />
            <path
              d="M72 16C72 13.8 70.2 12 68 12H46C43.8 12 42 13.8 42 16V54C42 54 49 51 57 51C65 51 72 54 72 54V16Z"
              fill="#FFFDF9"
              stroke="#6F5446"
              strokeWidth="1.5"
            />
            <path d="M19 23H34M19 30H34M19 37H29" stroke="#C7B9AE" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M50 23H65M50 30H65M50 37H60" stroke="#C7B9AE" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M42 14V55" stroke="#6D2E46" strokeWidth="1.8" />
          </svg>

          <h3 className="font-serif text-2xl font-medium text-[#2B211D]">
            {hasActiveFilters
              ? 'No matching entries found.'
              : activeView === 'completed'
              ? 'No completed tasks yet.'
              : selectedCategory
              ? `Nothing filed under ${selectedCategory.name} yet.`
              : 'A fresh blank page.'}
          </h3>

          <p className="mt-2 max-w-sm text-sm text-[#6B5A52]">
            {hasActiveFilters
              ? 'Try clearing your search or filter selections to see more tasks.'
              : activeView === 'completed'
              ? 'Tasks you check off will gather neatly here.'
              : 'Jot down a quick note above or open the task sheet to add deadlines and details.'}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="border border-[#2B211D]/15 bg-[#FFFDF9] px-4 py-2 text-xs font-medium text-[#2B211D] hover:bg-[#F3EDE3]"
              >
                Reset filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenNewTask}
                className="inline-flex items-center gap-1.5 bg-[#6D2E46] px-4 py-2 text-xs font-medium text-[#FFFDF9] hover:bg-[#562336]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add your first task</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                category={task.category_id ? categoryMap.get(task.category_id) : undefined}
                viewMode="grid"
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onQuickPriorityChange={onQuickPriorityChange}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="border-t border-[#2B211D]/10">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                category={task.category_id ? categoryMap.get(task.category_id) : undefined}
                viewMode="list"
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onQuickPriorityChange={onQuickPriorityChange}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
