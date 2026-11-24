import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  LogOut,
  Settings2,
  Sun,
  X,
} from 'lucide-react';
import type { Category, NavView } from '../../types/planner';

interface SidebarProps {
  activeView: NavView;
  selectedCategoryId: string | null;
  categories: Category[];
  counts: {
    myDay: number;
    upcoming: number;
    all: number;
    completed: number;
    byCategory: Record<string, number>;
  };
  userEmail: string;
  displayName: string;
  isSupabaseMode: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectView: (view: NavView) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenCategoryManager: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedCategoryId,
  categories,
  counts,
  userEmail,
  displayName,
  isSupabaseMode,
  mobileOpen,
  onCloseMobile,
  onSelectView,
  onSelectCategory,
  onOpenCategoryManager,
  onOpenSettings,
  onSignOut,
}) => {
  const navItems: Array<{
    id: NavView;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    { id: 'my-day', label: 'My Day', count: counts.myDay, icon: <Sun className="h-4 w-4" /> },
    {
      id: 'upcoming',
      label: 'Upcoming',
      count: counts.upcoming,
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: 'all',
      label: 'All Tasks',
      count: counts.all,
      icon: <FolderKanban className="h-4 w-4" />,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ];

  const content = (
    <div className="flex h-full w-64 flex-col border-r border-[#2B211D]/10 bg-[#F3EDE3]/90 text-[#2B211D]">
      {/* Brand Lockup */}
      <div className="flex items-center justify-between border-b border-[#2B211D]/10 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#6D2E46] text-[#FFFDF9]">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <span className="font-serif text-xl italic tracking-tight text-[#2B211D]">
              Folio
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded text-[#5A4A42] hover:bg-[#2B211D]/8 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Planner Views */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7">
        <nav aria-label="Planner views" className="space-y-1">
          <p className="px-2.5 pb-1.5 font-mono text-[11px] tracking-wider text-[#8C7B72] uppercase">
            Pages
          </p>
          {navItems.map((item) => {
            const isActive = activeView === item.id && !selectedCategoryId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectCategory(null);
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FFFDF9] font-medium text-[#6D2E46] shadow-[0_1px_3px_rgba(43,33,29,0.06)]'
                    : 'text-[#4A3B34] hover:bg-[#EAE1D4]/70 hover:text-[#2B211D]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#6D2E46]' : 'text-[#7C6A61]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-[#8C7B72]">
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Categories / Collections */}
        <div>
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <p className="font-mono text-[11px] tracking-wider text-[#8C7B72] uppercase">
              Collections
            </p>
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="text-xs font-medium text-[#6D2E46] underline-offset-4 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-1">
            {categories.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-[#8C7B72]">
                No collections yet.
              </p>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const count = counts.byCategory[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(isSelected ? null : cat.id);
                      if (!isSelected && activeView === 'completed') {
                        onSelectView('all');
                      }
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#FFFDF9] font-medium text-[#2B211D] shadow-[0_1px_3px_rgba(43,33,29,0.06)]'
                        : 'text-[#4A3B34] hover:bg-[#EAE1D4]/70 hover:text-[#2B211D]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[#8C7B72]">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Profile Section */}
      <div className="border-t border-[#2B211D]/10 bg-[#ECE4D7]/55 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/planner_avatar_default_1795506783081.jpg"
            alt="Planner owner portrait"
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 rounded-full border border-[#2B211D]/15 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#2B211D]">
              {displayName}
            </p>
            <p className="truncate text-xs text-[#7C6A61]">{userEmail}</p>
          </div>
        </div>

        {!isSupabaseMode && (
          <p className="mt-2.5 border border-[#C48291]/40 bg-[#F4E7EA]/70 px-2.5 py-1.5 text-[11px] leading-snug text-[#5A3440]">
            Local preview storage · Add Supabase env vars for cloud sync
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#2B211D]/8">
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A4A42] hover:text-[#2B211D] whitespace-nowrap shrink-0"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Preferences
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6D2E46] hover:text-[#562336] whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:shrink-0">{content}</aside>

      {/* Mobile / Tablet Slide-over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#241915]/35 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
};
