'use client';

import { ListingMatch } from '@/lib/matching';

const colorMap = {
  red: 'bg-riya',
  purple: 'bg-meera',
  peach: 'bg-kavita',
};

interface ListingCardProps {
  match: ListingMatch;
}

export default function ListingCard({ match }: ListingCardProps) {
  const { listing, matches, isBestMatch } = match;
  const hasFailure = matches.some((m) => m.status === 'fail');
  const rentShare = listing.rent ? Math.round(listing.rent / 3) : 0;

  return (
    <div
      className={`border-2 border-burgundy rounded-xl p-6 mb-6 ${
        hasFailure ? 'opacity-50' : ''
      }`}
    >
      {/* Best match sticker */}
      {isBestMatch && (
        <div className="absolute top-4 right-4 rotate-12 bg-cherry-red text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          best match!
        </div>
      )}

      {/* Failure sticker */}
      {hasFailure && (
        <div className="absolute top-4 right-4 -rotate-12 bg-cherry-red text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
          Doesn't work for {matches.find((m) => m.status === 'fail')?.memberName}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-fraunces text-burgundy">{listing.name}</h3>
        <div className="flex gap-4 mt-2 text-sm text-burgundy">
          {listing.area && <span>{listing.area}</span>}
          {listing.floor && <span>Floor {listing.floor}</span>}
        </div>
      </div>

      {/* Rent */}
      <div className="mb-6 pb-6 border-b border-burgundy border-dashed">
        <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-1">
          Rent
        </p>
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-burgundy">Total</p>
            <p className="text-2xl font-fraunces text-cherry-red">₹{listing.rent}</p>
          </div>
          <div>
            <p className="text-xs text-burgundy">Per person</p>
            <p className="text-2xl font-fraunces text-cherry-red">₹{rentShare}</p>
          </div>
        </div>
      </div>

      {/* Three chairs */}
      <div className="space-y-3">
        {matches.map((person) => (
          <div
            key={person.memberId}
            className={`flex items-center gap-3 p-3 rounded-lg border border-burgundy ${
              person.color === 'red'
                ? 'bg-riya/10'
                : person.color === 'purple'
                  ? 'bg-meera/10'
                  : 'bg-kavita/10'
            }`}
          >
            {/* Chair icon + name */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full ${
                  colorMap[person.color as keyof typeof colorMap]
                } flex items-center justify-center text-white text-xs font-bold`}
              >
                🪑
              </div>
              <span className="font-bold text-burgundy">{person.memberName}</span>
            </div>

            {/* Status pill */}
            {person.status === 'pass' && (
              <div className="px-3 py-1 bg-lavender text-burgundy rounded-full text-xs font-bold uppercase tracking-wider">
                ✓ Gets what she wants
              </div>
            )}
            {person.status === 'amber' && (
              <div className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full text-xs font-bold uppercase tracking-wider">
                ~ {person.reason}
              </div>
            )}
            {person.status === 'fail' && (
              <div className="px-3 py-1 bg-cherry-red text-white rounded-full text-xs font-bold uppercase tracking-wider">
                ✕ Dealbreaker
              </div>
            )}
            {person.status === 'unknown' && (
              <div className="px-3 py-1 border-2 border-dashed border-burgundy text-burgundy rounded-full text-xs font-bold uppercase tracking-wider">
                ? Needs checking
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reaction buttons (placeholder for Phase 4) */}
      <div className="mt-6 pt-6 border-t border-burgundy border-dashed flex gap-2">
        <button className="flex-1 px-3 py-2 border border-burgundy text-burgundy rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-bubblegum-pink transition-colors">
          I'm in
        </button>
        <button className="flex-1 px-3 py-2 border border-burgundy text-burgundy rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-bubblegum-pink transition-colors">
          I can live with it
        </button>
        <button className="flex-1 px-3 py-2 border border-burgundy text-burgundy rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-bubblegum-pink transition-colors">
          Hard pass
        </button>
      </div>
    </div>
  );
}
