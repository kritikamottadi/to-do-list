import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, Plus, Sparkles } from 'lucide-react';
import type { StickerType } from '../../types/planner';
import { STICKER_CATALOG, StickerGraphic, type StickerCatalogItem } from './StickerArtwork';

interface TrayItemProps {
  item: StickerCatalogItem;
  onQuickPlace: (item: StickerCatalogItem) => void;
}

const DraggableTraySticker: React.FC<TrayItemProps> = ({ item, onQuickPlace }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray-${item.type}`,
    data: {
      source: 'tray',
      stickerType: item.type,
      catalogItem: item,
    },
  });

  return (
    <div
      className={`group relative flex flex-col items-center justify-between border border-[#2B211D]/10 bg-[#FFFDF9] p-3 transition-colors hover:border-[#6D2E46]/35 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex h-24 w-full cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        title={`Drag ${item.label} onto the planner`}
      >
        <div className="scale-90 transition-transform duration-150 group-hover:scale-95">
          <StickerGraphic type={item.type} customText={item.defaultText} compact />
        </div>
      </div>

      <div className="mt-2 flex w-full items-center justify-between gap-2 border-t border-[#2B211D]/8 pt-2">
        <span className="truncate text-xs font-medium text-[#5A4A42]">{item.label}</span>
        <button
          type="button"
          onClick={() => onQuickPlace(item)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#6D2E46] transition-colors hover:bg-[#6D2E46]/10 focus-visible:outline-2 focus-visible:outline-[#6D2E46]"
          title={`Place ${item.label} on page`}
          aria-label={`Place ${item.label} on page`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

interface StickerTrayProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickPlace: (item: StickerCatalogItem) => void;
  placedCount: number;
  stickersLocked: boolean;
  onToggleLock: () => void;
}

const GROUPS: Array<StickerCatalogItem['group']> = [
  'Washi & Paper',
  'Botanical & Cozy',
  'Ink & Marks',
];

export const StickerTray: React.FC<StickerTrayProps> = ({
  isOpen,
  onClose,
  onQuickPlace,
  placedCount,
  stickersLocked,
  onToggleLock,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Sticker and Decorations Tray"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-[#2B211D]/12 bg-[#FAF6F0]/98 shadow-[-12px_0_32px_rgba(43,33,29,0.08)] backdrop-blur-xs"
    >
      <div className="flex items-start justify-between border-b border-[#2B211D]/10 px-6 py-5">
        <div>
          <p className="font-mono text-[11px] tracking-wider text-[#8C7B72] uppercase">
            Scrapbook Folio
          </p>
          <h2 className="font-serif mt-0.5 text-2xl font-medium text-[#2B211D]">
            Stickers &amp; Paper
          </h2>
          <p className="mt-1 text-xs text-[#6B5A52]">
            Drag any piece onto your page, or click + to place.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded text-[#5A4A42] transition-colors hover:bg-[#2B211D]/8 hover:text-[#2B211D]"
          aria-label="Close sticker tray"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-[#2B211D]/10 bg-[#F3EDE3]/60 px-6 py-2.5 text-xs text-[#5A4A42]">
        <span className="font-mono tabular-nums">{placedCount} placed on page</span>
        <button
          type="button"
          onClick={onToggleLock}
          className="font-medium text-[#6D2E46] underline-offset-4 hover:underline whitespace-nowrap shrink-0"
        >
          {stickersLocked ? 'Unlock stickers' : 'Lock stickers'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        {GROUPS.map((group) => {
          const items = STICKER_CATALOG.filter((s) => s.group === group);
          return (
            <section key={group}>
              <h3 className="font-serif mb-3 flex items-center gap-2 text-base font-medium text-[#2B211D]">
                <span>{group}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <DraggableTraySticker
                    key={item.type}
                    item={item}
                    onQuickPlace={onQuickPlace}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="border-t border-[#2B211D]/10 bg-[#FFFDF9] px-6 py-3.5 text-xs text-[#6B5A52]">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#6D2E46]" />
          Click any placed sticker to rotate, resize, layer, or edit notes.
        </span>
      </div>
    </aside>
  );
};
