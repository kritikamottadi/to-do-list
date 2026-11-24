import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { PaperTone, ViewMode, WorkspaceSettings } from '../../types/planner';

interface SettingsModalProps {
  isOpen: boolean;
  settings: WorkspaceSettings;
  onClose: () => void;
  onSave: (
    updates: Partial<
      Pick<WorkspaceSettings, 'display_name' | 'planner_mantra' | 'paper_tone' | 'default_view'>
    >
  ) => Promise<void>;
}

const PAPER_OPTIONS: Array<{ id: PaperTone; label: string; swatch: string }> = [
  { id: 'ivory', label: 'Warm Ivory', swatch: '#FAF6F0' },
  { id: 'blush', label: 'Dusty Cream', swatch: '#F9F2F2' },
  { id: 'sage', label: 'Soft Sage', swatch: '#F4F6F1' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(settings.display_name);
  const [mantra, setMantra] = useState(settings.planner_mantra);
  const [paperTone, setPaperTone] = useState<PaperTone>(settings.paper_tone);
  const [defaultView, setDefaultView] = useState<ViewMode>(settings.default_view);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(settings.display_name);
    setMantra(settings.planner_mantra);
    setPaperTone(settings.paper_tone);
    setDefaultView(settings.default_view);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        display_name: displayName.trim() || 'Planner Owner',
        planner_mantra: mantra.trim() || 'A little progress goes a long way.',
        paper_tone: paperTone,
        default_view: defaultView,
      });
      onClose();
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
        aria-labelledby="settings-modal-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-[#2B211D]/15 bg-[#FFFDF9] shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-[#2B211D]/10 px-6 py-4">
          <div>
            <p className="font-mono text-[11px] text-[#8C7B72] uppercase">
              Personalization
            </p>
            <h2
              id="settings-modal-heading"
              className="font-serif text-2xl font-medium text-[#2B211D]"
            >
              Planner preferences
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3]"
            aria-label="Close preferences"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="pref-name" className="block text-xs font-medium text-[#5A4A42]">
              Display name
            </label>
            <input
              id="pref-name"
              type="text"
              maxLength={48}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3.5 py-2 text-sm text-[#2B211D] focus:border-[#6D2E46] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="pref-mantra" className="block text-xs font-medium text-[#5A4A42]">
              Header handwritten note
            </label>
            <input
              id="pref-mantra"
              type="text"
              maxLength={90}
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              className="font-hand mt-1.5 w-full border border-[#2B211D]/15 bg-[#FAF6F0]/60 px-3.5 py-1.5 text-xl text-[#6D2E46] focus:border-[#6D2E46] focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[#5A4A42]">Paper tone</span>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {PAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaperTone(opt.id)}
                  className={`flex flex-col items-start border p-2.5 text-left transition-colors ${
                    paperTone === opt.id
                      ? 'border-[#6D2E46] bg-[#F4E7EA]/30'
                      : 'border-[#2B211D]/12 bg-[#FFFDF9] hover:border-[#2B211D]/30'
                  }`}
                >
                  <span
                    className="mb-2 h-5 w-full border border-[#2B211D]/12"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <span className="text-xs font-medium text-[#2B211D]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#5A4A42]">Default task layout</span>
            <div className="mt-1.5 grid grid-cols-2 border border-[#2B211D]/15 bg-[#F3EDE3] p-0.5">
              {(['list', 'grid'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDefaultView(mode)}
                  className={`py-1.5 text-xs font-medium capitalize ${
                    defaultView === mode
                      ? 'bg-[#FFFDF9] text-[#6D2E46] shadow-xs'
                      : 'text-[#5A4A42]'
                  }`}
                >
                  {mode} view
                </button>
              ))}
            </div>
          </div>

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
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
