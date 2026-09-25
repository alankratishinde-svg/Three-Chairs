'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Listing, Ranking } from '@/lib/types';

interface RankingScreenProps {
  members: Member[];
  listings: Listing[];
}

const RANKS = [1, 2, 3, 4, 5];

const colorMap: Record<Member['color'], string> = {
  red: 'pill-riya',
  purple: 'pill-meera',
  peach: 'pill-kavita',
};

export default function RankingScreen({ members, listings }: RankingScreenProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const listingIds = listings.map((l) => l.id);

  const loadRankings = useCallback(async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select('*')
      .in('listing_id', listingIds);
    if (!error) setRankings(data || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIds.join(',')]);

  useEffect(() => {
    loadRankings();

    const subscription = supabase
      .channel('rankings-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
        loadRankings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadRankings]);

  const memberRankings = (memberId: string) =>
    rankings.filter((r) => r.member_id === memberId);

  const completedCount = members.filter(
    (m) => memberRankings(m.id).length === listings.length
  ).length;

  const rankForListing = (memberId: string, listingId: string) =>
    rankings.find((r) => r.member_id === memberId && r.listing_id === listingId)?.rank ?? null;

  const usedRanks = (memberId: string) =>
    new Set(memberRankings(memberId).map((r) => r.rank));

  const handleRankChange = async (listingId: string, newRank: number | null) => {
    setSaving(true);
    try {
      const currentRow = rankings.find(
        (r) => r.member_id === selectedMemberId && r.listing_id === listingId
      );
      const conflictRow = rankings.find(
        (r) =>
          r.member_id === selectedMemberId &&
          r.rank === newRank &&
          r.listing_id !== listingId
      );

      if (newRank === null) {
        if (currentRow) {
          await supabase.from('rankings').delete().eq('id', currentRow.id);
        }
      } else {
        // Free up both slots first so the unique(member_id, rank) constraint
        // never sees two rows with the same rank at once (swap-safe).
        const oldRank = currentRow?.rank ?? null;
        if (currentRow) {
          await supabase.from('rankings').delete().eq('id', currentRow.id);
        }
        if (conflictRow) {
          await supabase.from('rankings').delete().eq('id', conflictRow.id);
        }

        await supabase.from('rankings').insert({
          member_id: selectedMemberId,
          listing_id: listingId,
          rank: newRank,
        });

        if (conflictRow && oldRank !== null) {
          await supabase.from('rankings').insert({
            member_id: selectedMemberId,
            listing_id: conflictRow.listing_id,
            rank: oldRank,
          });
        }
      }

      await loadRankings();
    } catch (err) {
      console.error('Failed to update ranking:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink">Loading listings...</p>
      </div>
    );
  }

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedUsedRanks = usedRanks(selectedMemberId);

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-ink mb-2">Rank the flats</h1>
        <p className="text-sm text-ink-soft mb-6">
          {completedCount} of {members.length} people have ranked all {listings.length}
        </p>

        <div className="flex gap-2 mb-8">
          {members.map((member) => {
            const done = memberRankings(member.id).length === listings.length;
            const active = member.id === selectedMemberId;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex-1 py-3 px-2 rounded-full border-2 font-bold uppercase tracking-wider text-sm transition-transform ${
                  active ? `text-white border-transparent ${colorMap[member.color]}` : 'bg-card text-ink border-hairline'
                }`}
              >
                {member.name} {done ? '✓' : ''}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-ink-soft mb-4">
          Ranking as <span className="font-bold">{selectedMember?.name}</span>. Tap a number to
          rank each flat, 1 (favourite) to 5 (least favourite). Tap again to clear.
        </p>

        <div className="space-y-4">
          {listings.map((listing) => {
            const rank = rankForListing(selectedMemberId, listing.id);
            return (
              <div
                key={listing.id}
                className="bg-card border-2 border-hairline rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  {listing.image_url && (
                    <img
                      src={listing.image_url}
                      alt={listing.name}
                      className="w-16 h-16 rounded-lg object-cover border border-hairline flex-shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-bold text-ink">{listing.name}</p>
                    <p className="text-sm text-ink-soft">
                      {listing.area ? `${listing.area} · ` : ''}
                      {listing.rent ? `₹${listing.rent}/mo` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {RANKS.map((r) => {
                    const isSelected = rank === r;
                    const isUsedElsewhere = selectedUsedRanks.has(r) && !isSelected;
                    return (
                      <button
                        key={r}
                        disabled={saving}
                        onClick={() => handleRankChange(listing.id, isSelected ? null : r)}
                        className={`w-9 h-9 rounded-full border-2 font-bold text-sm transition-colors disabled:opacity-50 ${
                          isSelected
                            ? 'pill-cta text-white border-transparent'
                            : isUsedElsewhere
                            ? 'bg-bubblegum-pink text-burgundy opacity-60 border-transparent'
                            : 'bg-card text-ink border-hairline hover:bg-lavender hover:text-burgundy hover:border-transparent'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
