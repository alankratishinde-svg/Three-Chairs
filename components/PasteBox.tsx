'use client';

import { useState } from 'react';

interface PasteBoxProps {
  isLoading: boolean;
  error: string;
  onPaste: (text: string) => void;
}

export default function PasteBox({ isLoading, error, onPaste }: PasteBoxProps) {
  const [pasted, setPasted] = useState('');

  const handlePaste = () => {
    if (pasted.trim()) {
      onPaste(pasted);
      setPasted('');
    }
  };

  return (
    <div className="bg-white border-2 border-burgundy rounded-xl p-8 mb-8">
      <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-4">
        Psst! Found something? Drop it here
      </p>

      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder="Paste the listing text or link here..."
        disabled={isLoading}
        className="w-full h-32 px-4 py-3 border border-burgundy rounded-lg text-burgundy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cherry-red disabled:opacity-50 resize-none"
      />

      {error && (
        <div className="mt-4 p-3 bg-bubblegum-pink text-burgundy rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <button
        onClick={handlePaste}
        disabled={isLoading || !pasted.trim()}
        className="w-full mt-4 bg-cherry-red text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-burgundy transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Extracting...' : 'Extract Details'}
      </button>

      <p className="text-xs text-burgundy mt-4">
        Paste from Housing.com, NoBroker, or anywhere—we'll pull out the key details.
      </p>
    </div>
  );
}
