'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Constraints, Listing, Member, Ranking, Vote } from '@/lib/types';
import { computeFit } from '@/lib/matchFit';
import { resolveVoting } from '@/lib/voting';

interface VotingScreenProps {
  members: Member[];
  listings: Listing[];
  rankings: Ranking[];
  votes: Vote[];
  top3Ids: string[];
  onVote: (memberId: string, round: number, listingId: string | null) => Promise<void>;
  onBackToHunt: () => void;
}

const colorMap: Record<Member['color'], string> = {
  red: 'pill-riya',
  purple: 'pill-meera',
  peach: 'pill-kavita',
};

function formatRent(listing: Listing) {
  if (!listing.rent) return 'Rent not listed';
  const total = listing.rent.toLocaleString('en-IN');
  const each = listing.rent_per_person
    ? listing.rent_per_person.toLocaleString('en-IN')
    : Math.round(listing.rent / 3).toLocaleString('en-IN');
  return `₹${total}/mo · ₹${each} each`;
}

function Confetti() {
  const pieces = Array.from({ length: 60 });
  const colors = ['#C8202F', '#7A1030', '#C9C6F6', '#F9B38A', '#F7C8D4'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2.5 + Math.random() * 2;
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-10px',
              width: 8,
              height: 14,
              background: color,
              animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
              borderRadius: 2,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default function VotingScreen({
  members,
  listings,
  rankings,
  votes,
  top3Ids,
  onVote,
  onBackToHunt,
}: VotingScreenProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id ?? '');
  const [constraintsMap, setConstraintsMap] = useState<Record<string, Constraints>>({});
  const backToHuntTriggered = useRef(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('constraints')
        .select('*')
        .in('member_id', members.map((m) => m.id));
      const map: Record<string, Constraints> = {};
      (data || []).forEach((c: Constraints) => {
        map[c.member_id] = c;
      });
      setConstraintsMap(map);
    };
    load();
  }, [members]);

  const outcome = resolveVoting(votes, members, top3Ids);

  useEffect(() => {
    if (outcome.status === 'back-to-hunt' && !backToHuntTriggered.current) {
      backToHuntTriggered.current = true;
      onBackToHunt();
    }
  }, [outcome.status, onBackToHunt]);

  const listingById = (id: string) => listings.find((l) => l.id === id);

  if (outcome.status === 'back-to-hunt') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-ink text-center">
          Nobody was sold on these five. Back to the hunt — finding a fresh set of flats...
        </p>
      </div>
    );
  }

  if (outcome.status === 'stalemate') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-ink text-center">
          Voting got stuck in a loop. Use the settings menu to reset and try again.
        </p>
      </div>
    );
  }

  if (outcome.status === 'winner') {
    const listing = listingById(outcome.listingId);
    if (!listing) return null;

    let vetoer: Member | undefined;
    if (!outcome.unanimous) {
      const vetoVote = votes.find((v) => v.round === outcome.round && v.listing_id === null);
      vetoer = members.find((m) => m.id === vetoVote?.member_id);
    }

    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <Confetti />
        <div className="max-w-lg w-full text-center relative z-10">
          {listing.image_url && (
            <img
              src={listing.image_url}
              alt={listing.name}
              className="w-full h-56 object-cover rounded-xl border-2 border-hairline mb-6"
            />
          )}
          <h1 className="text-3xl font-fraunces text-ink mb-2">
            Congratulations — you've found your new home 🏠
          </h1>
          <p className="text-lg font-bold text-ink mb-1">{listing.name}</p>
          <p className="text-sm text-ink-soft mb-1">{listing.address || listing.area}</p>
          <p className="text-sm text-ink-soft mb-4">{formatRent(listing)}</p>

          {!outcome.unanimous && vetoer && (
            <p className="text-xs text-ink-soft mb-4">
              Not unanimous — {vetoer.name} voted none, but the other two were sold.
            </p>
          )}

          {listing.source_url && (
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-bold text-cherry-red underline"
            >
              View original listing ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  // outcome.status === 'voting'
  const candidates = outcome.candidateIds.map(listingById).filter((l): l is Listing => !!l);
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const myVote = votes.find((v) => v.member_id === selectedMemberId && v.round === outcome.round);

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-ink mb-2">
          {outcome.round === 1 ? 'Your top 3' : `Tiebreak — round ${outcome.round}`}
        </h1>
        <p className="text-sm text-ink-soft mb-6">
          {outcome.votedMemberIds.length} of {members.length} have voted
        </p>

        <div className="flex gap-2 mb-8">
          {members.map((member) => {
            const hasVoted = votes.some((v) => v.member_id === member.id && v.round === outcome.round);
            const active = member.id === selectedMemberId;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex-1 py-3 px-2 rounded-full border-2 font-bold uppercase tracking-wider text-sm transition-transform ${
                  active ? `text-white border-transparent ${colorMap[member.color]}` : 'bg-card text-ink border-hairline'
                }`}
              >
                {member.name} {hasVoted ? '✓' : ''}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-ink-soft mb-6">
          Voting as <span className="font-bold">{selectedMember?.name}</span>. Private until everyone's in.
        </p>

        <div className="space-y-5">
          {candidates.map((listing) => {
            const isMyPick = myVote?.listing_id === listing.id;
            return (
              <div
                key={listing.id}
                className={`bg-card border-2 rounded-xl p-5 ${isMyPick ? 'border-cherry-red' : 'border-hairline'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.name}
                      className="w-16 h-16 rounded-lg object-cover border border-hairline flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-hairline bg-card flex items-center justify-center text-2xl flex-shrink-0">
                      🏠
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-ink">{listing.name}</p>
                    <p className="text-sm text-ink-soft">
                      {listing.area ? `${listing.area} · ` : ''}
                      {formatRent(listing)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {members.map((member) => {
                    const fit = computeFit(member.name, constraintsMap[member.id], listing);
                    const rank = rankings.find(
                      (r) => r.member_id === member.id && r.listing_id === listing.id
                    )?.rank;
                    return (
                      <p key={member.id} className="text-xs text-ink-soft">
                        <span className="font-bold text-ink">{member.name}</span>
                        {rank ? ` (ranked #${rank})` : ''}:{' '}
                        {fit.hardViolations.length > 0 ? (
                          <span className="text-cherry-red font-bold">
                            breaks her hard no — {fit.hardViolations.join(', ')}
                          </span>
                        ) : (
                          fit.verdict
                        )}
                      </p>
                    );
                  })}
                </div>

                <button
                  onClick={() => onVote(selectedMemberId, outcome.round, listing.id)}
                  className={`w-full py-3 rounded-full font-bold uppercase tracking-wider text-sm ${
                    isMyPick ? 'pill-cta text-white' : 'bg-transparent border-2 border-hairline text-ink hover:border-cherry-red'
                  }`}
                >
                  {isMyPick ? '✓ Picked' : 'Pick this one'}
                </button>
              </div>
            );
          })}
        </div>

        {outcome.allowNone && (
          <button
            onClick={() => onVote(selectedMemberId, outcome.round, null)}
            className={`w-full mt-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm border-2 ${
              myVote && myVote.listing_id === null
                ? 'bg-burgundy text-white border-transparent'
                : 'bg-transparent border-hairline text-ink-soft hover:border-ink-soft'
            }`}
          >
            {myVote && myVote.listing_id === null ? '✓ None of these' : 'None of these — keep searching'}
          </button>
        )}
      </div>
    </div>
  );
}
