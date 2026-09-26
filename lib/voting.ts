import { Member, Vote } from './types';

export type VotingOutcome =
  | { status: 'voting'; round: number; candidateIds: string[]; votedMemberIds: string[]; allowNone: boolean }
  | { status: 'winner'; listingId: string; unanimous: boolean; round: number }
  | { status: 'back-to-hunt' }
  | { status: 'stalemate'; candidateIds: string[] }; // safety net, shouldn't normally hit

const MAX_ROUNDS = 6;

/**
 * Pure function: given all cast votes and the top-3 finalist ids, works out
 * where voting currently stands. Every client computes the same answer from
 * the same `votes` rows, so no separate "current round" needs to be stored.
 */
export function resolveVoting(votes: Vote[], members: Member[], top3Ids: string[]): VotingOutcome {
  let round = 1;
  let candidateIds = top3Ids;
  let allowNone = true;

  while (round <= MAX_ROUNDS) {
    const roundVotes = votes.filter((v) => v.round === round);
    const votedMemberIds = roundVotes.map((v) => v.member_id);

    if (votedMemberIds.length < members.length) {
      return { status: 'voting', round, candidateIds, votedMemberIds, allowNone };
    }

    const noneCount = roundVotes.filter((v) => v.listing_id === null).length;
    const pickedIds = roundVotes.map((v) => v.listing_id).filter((id): id is string => id !== null);
    const distinctPicked = Array.from(new Set(pickedIds));

    if (allowNone && noneCount >= 2) {
      return { status: 'back-to-hunt' };
    }

    if (noneCount === 0 && distinctPicked.length === 1) {
      return { status: 'winner', listingId: distinctPicked[0], unanimous: true, round };
    }

    if (noneCount === 1 && distinctPicked.length === 1) {
      // One veto, but the other two agreed on the same flat - the veto is
      // flagged in the UI (this person is shown as least happy with it)
      // rather than being silently overridden.
      return { status: 'winner', listingId: distinctPicked[0], unanimous: false, round };
    }

    // Split: move to a tiebreak round among whichever listings got votes.
    candidateIds = distinctPicked;
    allowNone = false;
    round += 1;
  }

  return { status: 'stalemate', candidateIds };
}
