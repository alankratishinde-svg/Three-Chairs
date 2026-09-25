'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Listing, Ranking } from '@/lib/types';

interface SummaryScreenProps {
  members: Member[];
  listings: Listing[];
  onReset: () => void;
}

const colorMap: Record<Member['color'], string> = {
  red: 'pill-riya',
  purple: 'pill-meera',
  peach: 'pill-kavita',
};

export default function SummaryScreen({ members, listings, onReset }: SummaryScreenProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .in('listing_id', listings.map((l) => l.id));
      if (!error) setRankings(data || []);
      setLoading(false);
    };
    load();
  }, [listings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink">Tallying the votes...</p>
      </div>
    );
  }

  const rankFor = (memberId: string, listingId: string) =>
    rankings.find((r) => r.member_id === memberId && r.listing_id === listingId)?.rank ?? null;

  const totalScore = (listingId: string) =>
    members.reduce((sum, m) => sum + (rankFor(m.id, listingId) ?? listings.length + 1), 0);

  const sortedListings = [...listings].sort((a, b) => totalScore(a.id) - totalScore(b.id));

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-ink mb-2">Final Rankings</h1>
        <p className="text-sm text-ink-soft mb-8">
          Lowest total score wins — everyone's ranked their favourite.
        </p>

        <div className="space-y-4">
          {sortedListings.map((listing, index) => (
            <div
              key={listing.id}
              className={`bg-card border-2 rounded-xl p-5 ${
                index === 0 ? 'border-cherry-red' : 'border-hairline'
              }`}
            >
              <div className="flex items-center justify-between mb-3 gap-4">
                <div className="flex items-center gap-3">
                  {listing.image_url && (
                    <img
                      src={listing.image_url}
                      alt={listing.name}
                      className="w-14 h-14 rounded-lg object-cover border border-hairline flex-shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-lg">🏆</span>}
                      <p className="font-bold text-ink">{listing.name}</p>
                    </div>
                    <p className="text-sm text-ink-soft">
                      {listing.area ? `${listing.area} · ` : ''}
                      {listing.rent ? `₹${listing.rent}/mo` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-ink-soft opacity-80 flex-shrink-0">Score: {totalScore(listing.id)}</p>
              </div>

              <div className="flex gap-3">
                {members.map((member) => {
                  const rank = rankFor(member.id, listing.id);
                  return (
                    <div
                      key={member.id}
                      className={`flex-1 rounded-lg py-2 text-center text-white font-bold text-sm ${colorMap[member.color]}`}
                    >
                      <div className="text-xs uppercase opacity-90">{member.name}</div>
                      <div>{rank ?? '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onReset}
          className="pill-cta w-full mt-10 text-white font-bold py-4 rounded-full uppercase tracking-wider"
        >
          Reset & Start Over
        </button>
      </div>
    </div>
  );
}
