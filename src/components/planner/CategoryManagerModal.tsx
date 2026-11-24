import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { STATIONERY_COLORS, type Category } from '../../types/planner';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onCreateCategory: (name: string, color: string) => Promise<void>;
  onUpdateCategory: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(STATIONERY_COLORS[0].hex);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onCreateCategory(newName.trim(), newColor);
      setNewName('');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      await onUpdateCategory(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
    } finally {
      setBusy(false);
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
        aria-labelledby="category-modal-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-[#2B211D]/15 bg-[#FFFDF9] shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-[#2B211D]/10 px-6 py-4">
          <div>
            <p className="font-mono text-[11px] text-[#8C7B72] uppercase">
              Collections
            </p>
            <h2
              id="category-modal-heading"
              className="font-serif text-2xl font-medium text-[#2B211D]"
            >
              Manage categories
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3]"
            aria-label="Close category manager"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Create Form */}
          <form onSubmit={handleCreate} className="space-y-3 border-b border-[#2B211D]/10 pb-5">
            <label htmlFor="new-category-name" className="block text-xs font-medium text-[#5A4A42]">
              New collection
            </label>
            <div className="flex gap-2">
              <input
                id="new-category-name"
                type="text"
                maxLength={40}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Studio, Reading List"
                className="flex-1 border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3 py-2 text-sm text-[#2B211D] placeholder:text-[#9A8A80] focus:border-[#6D2E46] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newName.trim() || busy}
                className="inline-flex items-center gap-1 bg-[#6D2E46] px-3.5 py-2 text-xs font-medium text-[#FFFDF9] hover:bg-[#562336] disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {STATIONERY_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setNewColor(swatch.hex)}
                  title={swatch.name}
                  aria-label={`Select color ${swatch.name}`}
                  className={`h-6 w-6 rounded-xs transition-transform ${
                    newColor === swatch.hex
                      ? 'scale-110 ring-2 ring-[#2B211D] ring-offset-2 ring-offset-[#FFFDF9]'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          </form>

          {/* Existing Categories */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#8C7B72]">
                No collections created yet.
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-[#2B211D]/10 bg-[#FAF6F0]/55 px-3 py-2.5"
                >
                  {editingId === cat.id ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          maxLength={40}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(cat.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="flex-1 border border-[#6D2E46]/50 bg-[#FFFDF9] px-2.5 py-1 text-sm text-[#2B211D] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(cat.id)}
                          className="flex h-7 w-7 items-center justify-center bg-[#6D2E46] text-white"
                          aria-label="Save category"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex h-7 w-7 items-center justify-center border border-[#2B211D]/15 text-[#5A4A42]"
                          aria-label="Cancel editing"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STATIONERY_COLORS.map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setEditColor(swatch.hex)}
                            className={`h-5 w-5 rounded-xs ${
                              editColor === swatch.hex
                                ? 'ring-2 ring-[#2B211D] ring-offset-1'
                                : 'opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                            aria-label={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate text-sm font-medium text-[#2B211D]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[#6B5A52] hover:bg-[#EAE1D4] hover:text-[#2B211D]"
                          aria-label={`Rename ${cat.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[#6B5A52] hover:bg-[#F4E7EA] hover:text-[#8E354A]"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
