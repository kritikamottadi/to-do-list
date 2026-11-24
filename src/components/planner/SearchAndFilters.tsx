import React, { useState } from 'react';
import { LayoutGrid, List, Plus, Search, X } from 'lucide-react';
import type {
  Category,
  Priority,
  SortField,
  StatusFilter,
  ViewMode,
} from '../../types/planner';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: Category[];
  filterCategoryId: string;
  onFilterCategoryChange: (id: string) => void;
  filterPriority: 'all' | Priority;
  onFilterPriorityChange: (p: 'all' | Priority) => void;
  filterStatus: StatusFilter;
  onFilterStatusChange: (s: StatusFilter) => void;
  sortBy: SortField;
  onSortByChange: (s: SortField) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  onQuickAdd: (title: string) => Promise<void>;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  filterCategoryId,
  onFilterCategoryChange,
  filterPriority,
  onFilterPriorityChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  onQuickAdd,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickTitle.trim();
    if (!clean || adding) return;
    setAdding(true);
    try {
      await onQuickAdd(clean);
      setQuickTitle('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4 py-5">
      {/* Quick-add Stationery Input */}
      <form
        onSubmit={handleQuickSubmit}
        className="flex items-center gap-2 border border-[#2B211D]/14 bg-[#FFFDF9] px-4 py-2.5 shadow-[0_1px_4px_rgba(43,33,29,0.03)] focus-within:border-[#6D2E46]/50"
      >
        <Plus className="h-4 w-4 shrink-0 text-[#6D2E46]" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quickly jot down a task and press Enter..."
          maxLength={220}
          className="w-full bg-transparent text-sm text-[#2B211D] placeholder:text-[#9A8A80] focus:outline-none"
        />
        {quickTitle.trim() && (
          <button
            type="submit"
            disabled={adding}
            className="bg-[#6D2E46] px-3 py-1 text-xs font-medium text-[#FFFDF9] transition-colors hover:bg-[#562336] whitespace-nowrap shrink-0"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        )}
      </form>

      {/* Search, Filters, Sort & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#8C7B72]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="w-full border border-[#2B211D]/12 bg-[#FFFDF9] py-1.5 pr-8 pl-8 text-xs text-[#2B211D] placeholder:text-[#9A8A80] focus:border-[#6D2E46]/45 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-[#8C7B72] hover:text-[#2B211D]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            aria-label="Filter by category"
            value={filterCategoryId}
            onChange={(e) => onFilterCategoryChange(e.target.value)}
            className="border border-[#2B211D]/12 bg-[#FFFDF9] px-2.5 py-1.5 text-xs text-[#4A3B34] focus:border-[#6D2E46]/45 focus:outline-none"
          >
            <option value="all">All collections</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            aria-label="Filter by priority"
            value={filterPriority}
            onChange={(e) => onFilterPriorityChange(e.target.value as 'all' | Priority)}
            className="border border-[#2B211D]/12 bg-[#FFFDF9] px-2.5 py-1.5 text-xs text-[#4A3B34] focus:border-[#6D2E46]/45 focus:outline-none"
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as StatusFilter)}
            className="border border-[#2B211D]/12 bg-[#FFFDF9] px-2.5 py-1.5 text-xs text-[#4A3B34] focus:border-[#6D2E46]/45 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort */}
          <select
            aria-label="Sort tasks"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortField)}
            className="border border-[#2B211D]/12 bg-[#FFFDF9] px-2.5 py-1.5 text-xs text-[#4A3B34] focus:border-[#6D2E46]/45 focus:outline-none"
          >
            <option value="due_date">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="created_at">Sort: Created date</option>
          </select>
        </div>

        {/* View Toggle */}
        <div
          role="group"
          aria-label="Task layout view"
          className="flex items-center border border-[#2B211D]/12 bg-[#F3EDE3] p-0.5 shrink-0"
        >
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'list'
                ? 'bg-[#FFFDF9] text-[#2B211D] shadow-xs'
                : 'text-[#6B5A52] hover:text-[#2B211D]'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'grid'
                ? 'bg-[#FFFDF9] text-[#2B211D] shadow-xs'
                : 'text-[#6B5A52] hover:text-[#2B211D]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
