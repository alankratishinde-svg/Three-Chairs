'use client';

import { useState } from 'react';

interface SettingsMenuProps {
  onReset: () => void;
}

export default function SettingsMenu({ onReset }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-card border-2 border-hairline text-ink rounded-full hover:bg-burgundy hover:text-white transition-colors text-lg"
      >
        ⚙
      </button>

      {open && !confirming && (
        <div className="fixed top-16 right-4 z-50 bg-cream border-2 border-hairline rounded-xl p-2 min-w-[180px] shadow-xl">
          <button
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-ink hover:bg-bubblegum-pink hover:text-burgundy transition-colors"
          >
            Reset & start over
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-cream border-2 border-hairline rounded-xl p-6 max-w-sm w-full">
            <p className="font-bold text-ink mb-2">Reset everything?</p>
            <p className="text-sm text-ink-soft mb-6">
              This clears all three forms, listings, rankings, and votes for everyone. Nobody can undo this.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 px-4 py-2 border-2 border-hairline text-ink font-bold rounded-lg uppercase tracking-wider text-sm hover:bg-bubblegum-pink hover:text-burgundy transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  onReset();
                }}
                className="pill-cta flex-1 text-white font-bold py-2 rounded-full uppercase tracking-wider text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
