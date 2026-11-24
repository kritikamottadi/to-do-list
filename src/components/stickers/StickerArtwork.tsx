import React from 'react';
import type { StickerType } from '../../types/planner';

export interface StickerCatalogItem {
  type: StickerType;
  label: string;
  group: 'Washi & Paper' | 'Botanical & Cozy' | 'Ink & Marks';
  defaultRotation: number;
  defaultText?: string;
}

export const STICKER_CATALOG: StickerCatalogItem[] = [
  { type: 'washi_pink', label: 'Rose Washi', group: 'Washi & Paper', defaultRotation: -6 },
  { type: 'washi_sage', label: 'Sage Washi', group: 'Washi & Paper', defaultRotation: 5 },
  { type: 'washi_butter', label: 'Butter Washi', group: 'Washi & Paper', defaultRotation: -3 },
  { type: 'paper_clip', label: 'Brass Clip', group: 'Washi & Paper', defaultRotation: 12 },
  {
    type: 'motivational_note',
    label: 'Lined Note',
    group: 'Washi & Paper',
    defaultRotation: -3,
    defaultText: 'Breathe & begin gently.',
  },
  {
    type: 'polaroid_frame',
    label: 'Polaroid',
    group: 'Washi & Paper',
    defaultRotation: 4,
    defaultText: 'slow mornings',
  },
  { type: 'pressed_daisy', label: 'Pressed Daisy', group: 'Botanical & Cozy', defaultRotation: -8 },
  { type: 'eucalyptus_sprig', label: 'Eucalyptus', group: 'Botanical & Cozy', defaultRotation: 10 },
  { type: 'espresso_cup', label: 'Morning Coffee', group: 'Botanical & Cozy', defaultRotation: -4 },
  { type: 'stacked_books', label: 'Reading Stack', group: 'Botanical & Cozy', defaultRotation: 3 },
  { type: 'strawberry', label: 'Strawberry', group: 'Botanical & Cozy', defaultRotation: -10 },
  { type: 'peach', label: 'Summer Peach', group: 'Botanical & Cozy', defaultRotation: 8 },
  { type: 'cloud_sketch', label: 'Soft Cloud', group: 'Botanical & Cozy', defaultRotation: -2 },
  { type: 'sparkle_ink', label: 'Ink Sparkles', group: 'Ink & Marks', defaultRotation: 6 },
  { type: 'star_gold', label: 'Gold Star', group: 'Ink & Marks', defaultRotation: -12 },
  { type: 'heart_wax', label: 'Wax Heart', group: 'Ink & Marks', defaultRotation: 5 },
  { type: 'ribbon_bow', label: 'Velvet Bow', group: 'Ink & Marks', defaultRotation: -7 },
  { type: 'curved_arrow', label: 'Margin Arrow', group: 'Ink & Marks', defaultRotation: 0 },
];

interface StickerGraphicProps {
  type: StickerType;
  customText?: string | null;
  compact?: boolean;
}

export const StickerGraphic: React.FC<StickerGraphicProps> = ({
  type,
  customText,
  compact = false,
}) => {
  switch (type) {
    case 'washi_pink':
      return (
        <div
          className="washi-stripes-pink relative h-7 w-28 opacity-90 shadow-[0_2px_6px_rgba(43,33,29,0.08)]"
          style={{
            clipPath:
              'polygon(2% 0%, 98% 2%, 100% 25%, 97% 50%, 100% 75%, 98% 100%, 2% 98%, 0% 72%, 3% 45%, 0% 20%)',
          }}
        />
      );

    case 'washi_sage':
      return (
        <div
          className="washi-stripes-sage relative h-7 w-28 opacity-90 shadow-[0_2px_6px_rgba(43,33,29,0.08)]"
          style={{
            clipPath:
              'polygon(1% 3%, 99% 0%, 97% 30%, 100% 60%, 98% 97%, 2% 100%, 0% 70%, 2% 38%)',
          }}
        />
      );

    case 'washi_butter':
      return (
        <div
          className="washi-stripes-butter relative h-6 w-28 opacity-90 shadow-[0_2px_6px_rgba(43,33,29,0.08)]"
          style={{
            clipPath:
              'polygon(0% 5%, 98% 0%, 100% 42%, 97% 95%, 1% 100%, 3% 55%)',
          }}
        />
      );

    case 'paper_clip':
      return (
        <svg width={compact ? 38 : 44} height={compact ? 64 : 74} viewBox="0 0 44 74" fill="none">
          <path
            d="M15 20V50C15 58 29 58 29 50V14C29 7.5 19 7.5 19 14V46C19 50 25 50 25 46V21"
            stroke="#A88246"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M16 20V50C16 56.5 28 56.5 28 50V14"
            stroke="#D6B87A"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );

    case 'sparkle_ink':
      return (
        <svg width={compact ? 58 : 74} height={compact ? 58 : 74} viewBox="0 0 74 74" fill="none">
          <path
            d="M37 10C38.5 26 42 30 58 31.5C42 33 38.5 37 37 53C35.5 37 32 33 16 31.5C32 30 35.5 26 37 10Z"
            fill="#F4E3AD"
            stroke="#6D2E46"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M57 44C57.7 51 59.3 52.8 66 53.5C59.3 54.2 57.7 56 57 63C56.3 56 54.7 54.2 48 53.5C54.7 52.8 56.3 51 57 44Z"
            fill="#D8A7B1"
            stroke="#6D2E46"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="19" r="2.2" fill="#6D2E46" />
          <circle cx="20" cy="54" r="1.5" fill="#C7A23E" />
        </svg>
      );

    case 'star_gold':
      return (
        <svg width={compact ? 56 : 70} height={compact ? 56 : 70} viewBox="0 0 70 70" fill="none">
          <path
            d="M35 8L42.2 24.4L60 26.2L46.7 38.1L50.4 55.6L35 46.5L19.6 55.6L23.3 38.1L10 26.2L27.8 24.4L35 8Z"
            fill="#FFFDF9"
            stroke="#FFFDF9"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <path
            d="M35 8L42.2 24.4L60 26.2L46.7 38.1L50.4 55.6L35 46.5L19.6 55.6L23.3 38.1L10 26.2L27.8 24.4L35 8Z"
            fill="#EBD58C"
            stroke="#6F5446"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="35" cy="34" r="3.5" fill="#6D2E46" opacity="0.25" />
        </svg>
      );

    case 'pressed_daisy':
      return (
        <svg width={compact ? 64 : 84} height={compact ? 64 : 84} viewBox="0 0 84 84" fill="none">
          <g filter="drop-shadow(0 2px 4px rgba(43,33,29,0.1))">
            <path d="M42 44C42 57 40 68 38 77" stroke="#6E8268" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M41 62C47 59 53 56 56 52C51 52 45 55 41 62Z" fill="#B5C4AD" stroke="#53654E" strokeWidth="1.2" />
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <ellipse
                key={deg}
                cx="42"
                cy="20"
                rx="4.6"
                ry="12"
                fill="#FFFDF8"
                stroke="#8C7B72"
                strokeWidth="1.1"
                transform={`rotate(${deg} 42 35)`}
              />
            ))}
            <circle cx="42" cy="35" r="7.5" fill="#E3BE62" stroke="#6F5446" strokeWidth="1.3" />
            <circle cx="40" cy="33" r="1.2" fill="#6F5446" opacity="0.5" />
            <circle cx="44" cy="36" r="1" fill="#6F5446" opacity="0.5" />
          </g>
        </svg>
      );

    case 'eucalyptus_sprig':
      return (
        <svg width={compact ? 64 : 82} height={compact ? 72 : 94} viewBox="0 0 82 94" fill="none">
          <path d="M41 85C40 62 41 34 45 10" stroke="#53654E" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="29" cy="66" rx="10" ry="7" transform="rotate(-24 29 66)" fill="#CFE0C8" stroke="#53654E" strokeWidth="1.2" />
          <ellipse cx="54" cy="59" rx="10" ry="7" transform="rotate(20 54 59)" fill="#B8CCA9" stroke="#53654E" strokeWidth="1.2" />
          <ellipse cx="28" cy="46" rx="9.5" ry="6.5" transform="rotate(-20 28 46)" fill="#B8CCA9" stroke="#53654E" strokeWidth="1.2" />
          <ellipse cx="53" cy="39" rx="9" ry="6.5" transform="rotate(25 53 39)" fill="#CFE0C8" stroke="#53654E" strokeWidth="1.2" />
          <ellipse cx="32" cy="27" rx="8" ry="5.5" transform="rotate(-18 32 27)" fill="#CFE0C8" stroke="#53654E" strokeWidth="1.2" />
          <ellipse cx="45" cy="13" rx="5.5" ry="7.5" fill="#B8CCA9" stroke="#53654E" strokeWidth="1.2" />
        </svg>
      );

    case 'heart_wax':
      return (
        <svg width={compact ? 56 : 68} height={compact ? 56 : 68} viewBox="0 0 68 68" fill="none">
          <circle cx="34" cy="34" r="26" fill="#6D2E46" stroke="#542135" strokeWidth="1.5" />
          <circle cx="34" cy="34" r="20.5" fill="#7C3751" stroke="#994E69" strokeWidth="1" />
          <path
            d="M34 45C34 45 21 36.8 21 28.5C21 24.4 24.2 21.5 28 21.5C30.8 21.5 32.9 23.1 34 25.2C35.1 23.1 37.2 21.5 40 21.5C43.8 21.5 47 24.4 47 28.5C47 36.8 34 45 34 45Z"
            fill="#F4E3E6"
          />
        </svg>
      );

    case 'ribbon_bow':
      return (
        <svg width={compact ? 66 : 86} height={compact ? 50 : 62} viewBox="0 0 86 62" fill="none">
          <path d="M40 31C32 42 26 51 20 55L27 48L31 56C35 49 38 40 42 32" fill="#D8A7B1" stroke="#6D2E46" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M46 31C54 42 60 51 66 55L59 48L55 56C51 49 48 40 44 32" fill="#D8A7B1" stroke="#6D2E46" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M41 28C29 14 14 14 14 26C14 35 28 36 41 29Z" fill="#E8C2CA" stroke="#6D2E46" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M45 28C57 14 72 14 72 26C72 35 58 36 45 29Z" fill="#E8C2CA" stroke="#6D2E46" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="38" y="23" width="10" height="11" rx="4" fill="#D8A7B1" stroke="#6D2E46" strokeWidth="1.5" />
        </svg>
      );

    case 'espresso_cup':
      return (
        <svg width={compact ? 60 : 76} height={compact ? 60 : 76} viewBox="0 0 76 76" fill="none">
          <path d="M28 19C26 15 30 12 28 8" stroke="#8C7B72" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M38 18C36 13 40 10 38 6" stroke="#8C7B72" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M48 19C46 15 50 12 48 8" stroke="#8C7B72" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="37" cy="60" rx="22" ry="5" fill="#EADFD3" stroke="#5A4A42" strokeWidth="1.4" />
          <path d="M19 30H54V45C54 53.5 46.5 58 36.5 58C26.5 58 19 53.5 19 45V30Z" fill="#FFFDF9" stroke="#5A4A42" strokeWidth="1.6" />
          <path d="M54 34H59C62.5 34 64.5 36.5 64.5 39.5C64.5 42.5 62.5 45 59 45H54" stroke="#5A4A42" strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="36.5" cy="30" rx="17.5" ry="4" fill="#8C5B44" stroke="#5A4A42" strokeWidth="1.4" />
        </svg>
      );

    case 'stacked_books':
      return (
        <svg width={compact ? 64 : 84} height={compact ? 58 : 74} viewBox="0 0 84 74" fill="none">
          <rect x="10" y="46" width="62" height="16" rx="2" fill="#7A8B73" stroke="#3D4A38" strokeWidth="1.4" />
          <rect x="14" y="49" width="54" height="10" rx="1" fill="#F4EFE6" />
          <rect x="16" y="30" width="56" height="16" rx="2" fill="#D8A7B1" stroke="#6D2E46" strokeWidth="1.4" />
          <rect x="20" y="33" width="48" height="10" rx="1" fill="#FFFDF9" />
          <rect x="12" y="14" width="54" height="16" rx="2" fill="#6D2E46" stroke="#471C2D" strokeWidth="1.4" />
          <path d="M52 28V39L55 36L58 39V28" fill="#EBD58C" stroke="#6F5446" strokeWidth="1" />
        </svg>
      );

    case 'strawberry':
      return (
        <svg width={compact ? 56 : 70} height={compact ? 60 : 76} viewBox="0 0 70 76" fill="none">
          <path
            d="M35 18C48 18 55 28 52 41C49 54 41 64 35 64C29 64 21 54 18 41C15 28 22 18 35 18Z"
            fill="#D4747E"
            stroke="#6D2E46"
            strokeWidth="1.6"
          />
          <path d="M24 20C28 14 33 13 35 18C37 13 42 14 46 20C41 21 38 22 35 20C32 22 29 21 24 20Z" fill="#7A8B73" stroke="#43523D" strokeWidth="1.3" />
          <path d="M35 15V9" stroke="#43523D" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="28" cy="33" r="1.3" fill="#F9F2D6" />
          <circle cx="38" cy="30" r="1.3" fill="#F9F2D6" />
          <circle cx="33" cy="42" r="1.3" fill="#F9F2D6" />
          <circle cx="43" cy="41" r="1.3" fill="#F9F2D6" />
          <circle cx="29" cy="51" r="1.3" fill="#F9F2D6" />
          <circle cx="37" cy="54" r="1.3" fill="#F9F2D6" />
        </svg>
      );

    case 'peach':
      return (
        <svg width={compact ? 58 : 72} height={compact ? 58 : 72} viewBox="0 0 72 72" fill="none">
          <path
            d="M36 22C47 17 58 24 57 38C56 51 44 60 36 60C28 60 16 51 15 38C14 24 25 17 36 22Z"
            fill="#EBB49A"
            stroke="#7C4E3C"
            strokeWidth="1.5"
          />
          <path d="M36 22C34 33 35 45 36 60" stroke="#A66A52" strokeWidth="1.2" opacity="0.55" />
          <path d="M37 21C42 12 51 11 54 16C48 20 42 21 37 21Z" fill="#7A8B73" stroke="#43523D" strokeWidth="1.3" />
        </svg>
      );

    case 'cloud_sketch':
      return (
        <svg width={compact ? 70 : 92} height={compact ? 48 : 60} viewBox="0 0 92 60" fill="none">
          <path
            d="M24 46H68C75.5 46 81 40.8 81 34C81 27.8 76.2 22.8 70 22.2C67.8 14 60.4 8 51.5 8C42 8 34.2 14.8 32.8 23.8C31.2 23.2 29.4 23 27.5 23C19.5 23 13 28.8 13 35.8C13 41.8 17.8 46 24 46Z"
            fill="#FFFDF9"
            stroke="#8C7B72"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M24 41H66" stroke="#B8ADC9" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        </svg>
      );

    case 'curved_arrow':
      return (
        <svg width={compact ? 64 : 84} height={compact ? 50 : 62} viewBox="0 0 84 62" fill="none">
          <path
            d="M12 46C22 18 46 14 69 27"
            stroke="#6D2E46"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M61 18L71 28L58 32"
            stroke="#6D2E46"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'motivational_note':
      return (
        <div
          className={`lined-note-bg relative border border-[#2B211D]/15 shadow-[0_4px_12px_rgba(43,33,29,0.08)] ${
            compact ? 'w-32 px-2.5 py-2' : 'w-44 px-3.5 py-3'
          }`}
        >
          <div className="washi-stripes-butter mx-auto -mt-5 mb-1.5 h-3.5 w-14 opacity-90" />
          <p
            className={`font-hand text-center leading-snug text-[#2B211D] ${
              compact ? 'text-sm' : 'text-lg'
            }`}
          >
            {customText || 'Breathe & begin gently.'}
          </p>
        </div>
      );

    case 'polaroid_frame':
      return (
        <div
          className={`relative border border-[#2B211D]/12 bg-[#FFFDF9] shadow-[0_6px_16px_rgba(43,33,29,0.12)] ${
            compact ? 'w-24 p-1.5 pb-4' : 'w-36 p-2.5 pb-7'
          }`}
        >
          <div className="washi-stripes-pink mx-auto -mt-4 mb-1.5 h-3 w-12 opacity-90" />
          <div className="aspect-square w-full overflow-hidden bg-[#EFE8DC]">
            <img
              src="/src/assets/images/polaroid_botanical_1795506785218.jpg"
              alt="Wildflowers and coffee polaroid"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
          <p
            className={`font-hand mt-1.5 text-center text-[#4A3B34] ${
              compact ? 'text-xs' : 'text-base'
            }`}
          >
            {customText || 'slow mornings'}
          </p>
        </div>
      );
  }
};
