import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import type { Sticker } from '../../types/planner';
import { StickerGraphic } from './StickerArtwork';

interface PlacedStickerItemProps {
  sticker: Sticker;
  isSelected: boolean;
  locked: boolean;
  onSelect: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<
      Pick<Sticker, 'rotation' | 'scale' | 'layer_order' | 'custom_text'>
    >
  ) => void;
  onDelete: (id: string) => void;
}

const PlacedStickerItem: React.FC<PlacedStickerItemProps> = ({
  sticker,
  isSelected,
  locked,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [editingText, setEditingText] = useState(false);
  const [draftText, setDraftText] = useState(sticker.custom_text ?? '');

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sticker.id,
    disabled: locked || editingText,
    data: {
      source: 'canvas',
      sticker,
    },
  });

  const supportsText =
    sticker.sticker_type === 'motivational_note' ||
    sticker.sticker_type === 'polaroid_frame';

  const dragTranslate = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : '';

  const activeTilt = isDragging ? -4 : 0;
  const activeScale = isDragging ? 1.06 : 1;

  const saveText = () => {
    onUpdate(sticker.id, { custom_text: draftText.trim() || null });
    setEditingText(false);
  };

  return (
    <div
      style={{
        left: `${sticker.x_position}%`,
        top: `${sticker.y_position}px`,
        zIndex: isSelected ? 35 : 10 + sticker.layer_order,
        transform: `${dragTranslate} translate(-50%, -50%)`,
      }}
      className={`absolute ${
        locked ? 'pointer-events-none opacity-90' : 'pointer-events-auto'
      } ${isDragging ? 'opacity-20' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) onSelect(sticker.id);
      }}
    >
      {/* Selected floating control bar */}
      {isSelected && !locked && !isDragging && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded border border-[#2B211D]/15 bg-[#FFFDF9] px-1.5 py-1 shadow-[0_6px_18px_rgba(43,33,29,0.12)]"
        >
          <button
            type="button"
            onClick={() => onUpdate(sticker.id, { rotation: sticker.rotation - 10 })}
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Rotate counter-clockwise"
            aria-label="Rotate counter-clockwise"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate(sticker.id, { rotation: sticker.rotation + 10 })}
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Rotate clockwise"
            aria-label="Rotate clockwise"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-[#2B211D]/12" />
          <button
            type="button"
            onClick={() =>
              onUpdate(sticker.id, {
                scale: Math.max(0.6, Number((sticker.scale - 0.15).toFixed(2))),
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Scale down"
            aria-label="Scale down"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate(sticker.id, {
                scale: Math.min(1.9, Number((sticker.scale + 0.15).toFixed(2))),
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Scale up"
            aria-label="Scale up"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-[#2B211D]/12" />
          <button
            type="button"
            onClick={() =>
              onUpdate(sticker.id, { layer_order: Math.max(1, sticker.layer_order - 1) })
            }
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Send backward"
            aria-label="Send backward"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate(sticker.id, { layer_order: sticker.layer_order + 1 })}
            className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
            title="Bring forward"
            aria-label="Bring forward"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          {supportsText && (
            <>
              <span className="mx-0.5 h-4 w-px bg-[#2B211D]/12" />
              <button
                type="button"
                onClick={() => {
                  setDraftText(sticker.custom_text ?? '');
                  setEditingText(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3] hover:text-[#2B211D]"
                title="Edit handwritten note"
                aria-label="Edit handwritten note"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <span className="mx-0.5 h-4 w-px bg-[#2B211D]/12" />
          <button
            type="button"
            onClick={() => onDelete(sticker.id)}
            className="flex h-7 w-7 items-center justify-center rounded text-[#8E354A] hover:bg-[#8E354A]/10"
            title="Remove sticker"
            aria-label="Remove sticker"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Inline note editor popover */}
      {isSelected && editingText && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-1/2 z-50 mt-2 flex w-56 -translate-x-1/2 items-center gap-1.5 rounded border border-[#2B211D]/15 bg-[#FFFDF9] p-1.5 shadow-md"
        >
          <input
            type="text"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveText();
              if (e.key === 'Escape') setEditingText(false);
            }}
            maxLength={60}
            autoFocus
            placeholder="Write a short note..."
            className="w-full bg-transparent px-2 py-1 font-hand text-base text-[#2B211D] focus:outline-none"
          />
          <button
            type="button"
            onClick={saveText}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#6D2E46] text-white"
            aria-label="Save note text"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Draggable Sticker Body */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          transform: `rotate(${sticker.rotation + activeTilt}deg) scale(${
            sticker.scale * activeScale
          })`,
        }}
        className={`touch-none select-none transition-transform duration-150 ${
          locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } ${
          isSelected && !locked
            ? 'ring-2 ring-[#6D2E46]/45 ring-offset-4 ring-offset-transparent rounded-sm'
            : ''
        }`}
      >
        <StickerGraphic type={sticker.sticker_type} customText={sticker.custom_text} />
      </div>
    </div>
  );
};

interface StickerCanvasProps {
  stickers: Sticker[];
  selectedStickerId: string | null;
  locked: boolean;
  onSelectSticker: (id: string | null) => void;
  onUpdateSticker: (
    id: string,
    updates: Partial<
      Pick<Sticker, 'rotation' | 'scale' | 'layer_order' | 'custom_text'>
    >
  ) => void;
  onDeleteSticker: (id: string) => void;
}

export const StickerCanvas: React.FC<StickerCanvasProps> = ({
  stickers,
  selectedStickerId,
  locked,
  onSelectSticker,
  onUpdateSticker,
  onDeleteSticker,
}) => {
  return (
    <div
      aria-label="Decorative stickers layer"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {stickers.map((sticker) => (
        <PlacedStickerItem
          key={sticker.id}
          sticker={sticker}
          isSelected={selectedStickerId === sticker.id}
          locked={locked}
          onSelect={(id) => onSelectSticker(id)}
          onUpdate={onUpdateSticker}
          onDelete={onDeleteSticker}
        />
      ))}
    </div>
  );
};
