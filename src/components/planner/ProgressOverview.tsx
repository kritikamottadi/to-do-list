import React, { useState } from 'react';
import { Menu, Plus, Sparkles, Check, Pencil } from 'lucide-react';
import type { Category, NavView } from '../../types/planner';
import { formatEditorialHeaderDate, getTimeGreeting } from '../../lib/dateUtils';

interface ProgressOverviewProps {
  activeView: NavView;
  selectedCategory: Category | null;
  mantra: string;
  pendingCount: number;
  completedCount: number;
  todayCompleted: number;
  todayTotal: number;
  stickerCount: number;
  onSaveMantra: (nextMantra: string) => void;
  onOpenNewTask: () => void;
  onToggleStickerTray: () => void;
  onOpenMobileSidebar: () => void;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  activeView,
  selectedCategory,
  mantra,
  pendingCount,
  completedCount,
  todayCompleted,
  todayTotal,
  stickerCount,
  onSaveMantra,
  onOpenNewTask,
  onToggleStickerTray,
  onOpenMobileSidebar,
}) => {
  const [editingMantra, setEditingMantra] = useState(false);
  const [draftMantra, setDraftMantra] = useState(mantra);

  const dateMeta = formatEditorialHeaderDate();
  const timeGreeting = getTimeGreeting();

  const viewHeadline = selectedCategory
    ? `${selectedCategory.name} notes.`
    : activeView === 'my-day'
    ? 'Your day, your pace.'
    : activeView === 'upcoming'
    ? 'Pages ahead.'
    : activeView === 'completed'
    ? 'Checked & kept.'
    : 'Everything on your desk.';

  const ratio = todayTotal > 0 ? Math.min(1, todayCompleted / todayTotal) : 0;
  const pct = Math.round(ratio * 100);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  const commitMantra = () => {
    const clean = draftMantra.trim() || 'A little progress goes a long way.';
    onSaveMantra(clean);
    setEditingMantra(false);
  };

  return (
    <header className="relative border-b border-[#2B211D]/10 pb-7 pt-6 sm:pt-8">
      {/* Top micro row: Mobile menu + Date stamp + Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded border border-[#2B211D]/15 bg-[#FFFDF9] text-[#2B211D] lg:hidden"
            aria-label="Open planner menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs tracking-wide text-[#7C6A61] uppercase">
            <span>{dateMeta.fullLine}</span>
            <span aria-hidden="true">·</span>
            <span className="normal-case font-sans text-xs text-[#6B5A52]">
              {timeGreeting}
            </span>
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleStickerTray}
            className="inline-flex items-center gap-1.5 border border-[#2B211D]/15 bg-[#FFFDF9] px-3.5 py-2 text-xs font-medium text-[#2B211D] transition-colors hover:border-[#6D2E46]/40 hover:bg-[#F3EDE3]/60 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#6D2E46]" />
            <span>Stickers</span>
            {stickerCount > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-[#8C7B72]">
                ({stickerCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 bg-[#6D2E46] px-4 py-2 text-xs font-medium text-[#FFFDF9] transition-colors hover:bg-[#562336] whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add a task</span>
          </button>
        </div>
      </div>

      {/* Main Editorial Title & Progress Band */}
      <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          {selectedCategory && (
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[#6B5A52]">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span>Collection</span>
            </div>
          )}

          <h1 className="font-serif text-4xl leading-[1.08] font-medium tracking-tight text-[#2B211D] text-balance sm:text-5xl">
            {viewHeadline}
          </h1>

          {/* Editable handwritten personal mantra */}
          <div className="mt-2.5">
            {editingMantra ? (
              <div className="flex max-w-md items-center gap-2">
                <input
                  type="text"
                  value={draftMantra}
                  onChange={(e) => setDraftMantra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitMantra();
                    if (e.key === 'Escape') {
                      setDraftMantra(mantra);
                      setEditingMantra(false);
                    }
                  }}
                  onBlur={commitMantra}
                  autoFocus
                  maxLength={90}
                  className="font-hand w-full border-b border-[#6D2E46] bg-transparent py-0.5 text-2xl text-[#6D2E46] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={commitMantra}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#6D2E46] text-white"
                  aria-label="Save personal note"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftMantra(mantra);
                  setEditingMantra(true);
                }}
                className="group inline-flex items-center gap-2 text-left"
                title="Click to edit your personal page note"
              >
                <span className="font-hand text-2xl text-[#6D2E46]/90">
                  {mantra}
                </span>
                <Pencil className="h-3 w-3 text-[#8C7B72] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Stationery Progress & Ledger Summary */}
        <div className="flex items-center gap-4 border-t border-[#2B211D]/10 pt-4 md:border-t-0 md:pt-0">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke="#E4DACB"
                strokeWidth="3.5"
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke="#6D2E46"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="font-mono absolute text-[11px] font-medium tabular-nums text-[#2B211D]">
              {pct}%
            </span>
          </div>

          <div className="text-xs leading-relaxed text-[#5A4A42]">
            <p className="font-medium text-[#2B211D]">
              Today&apos;s pace:{' '}
              <span className="font-mono tabular-nums">
                {todayCompleted}/{todayTotal}
              </span>
            </p>
            <p className="font-mono text-[11px] tabular-nums text-[#7C6A61]">
              {pendingCount} pending · {completedCount} completed
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
