import { Listing, Member, Constraints } from './types';

export type MatchStatus = 'pass' | 'amber' | 'fail' | 'unknown';

export interface PersonMatch {
  memberId: string;
  memberName: string;
  color: string;
  status: MatchStatus;
  reason?: string; // For amber/fail
}

export interface ListingMatch {
  listing: Listing;
  matches: PersonMatch[];
  compromiseCount: number; // Total amber seats across all three
  isBestMatch: boolean;
}

export function evaluateListingForPerson(
  listing: Listing,
  constraints: Constraints
): MatchStatus | { status: MatchStatus; reason: string } {
  // Check hard dealbreakers
  const hardNos = [
    { field: constraints.hard_needs_lift, listingField: listing.has_lift, label: 'lift' },
    { field: constraints.hard_needs_parking, listingField: listing.parking, label: 'parking' },
    { field: constraints.hard_needs_bathrooms_2_plus, listingField: listing.bathrooms, label: '2+ bathrooms' },
    { field: constraints.hard_pet_friendly, listingField: listing.pet_friendly, label: 'pet-friendly' },
  ];

  for (const no of hardNos) {
    if (no.field) {
      // This is a hard requirement
      if (no.listingField === null) {
        // Field not specified = unknown
        return 'unknown';
      }
      if (!no.listingField) {
        // Hard requirement not met
        return 'fail';
      }
    }
  }

  // All hard requirements passed. Now check soft preferences
  let hasAnyAmber = false;
  let amberReasons: string[] = [];

  const softPrefs = [
    { field: constraints.soft_needs_lift, listingField: listing.has_lift, label: 'lift' },
    { field: constraints.soft_needs_parking, listingField: listing.parking, label: 'parking' },
    { field: constraints.soft_needs_bathrooms_2_plus, listingField: listing.bathrooms, label: '2+ bathrooms' },
    { field: constraints.soft_pet_friendly, listingField: listing.pet_friendly, label: 'pet-friendly' },
    { field: constraints.soft_balcony, listingField: null, label: 'balcony' }, // Not in listing schema yet
    { field: constraints.soft_furnished, listingField: listing.furnishing === 'furnished', label: 'furnished' },
    { field: constraints.soft_gym_nearby, listingField: null, label: 'gym nearby' }, // Not in listing schema yet
  ];

  for (const pref of softPrefs) {
    if (pref.field) {
      // This is a soft preference
      if (pref.listingField === null) {
        // Listing doesn't specify, so it's a potential compromise
        hasAnyAmber = true;
        amberReasons.push(`No ${pref.label} mentioned`);
      } else if (!pref.listingField) {
        // Soft preference not met
        hasAnyAmber = true;
        amberReasons.push(`No ${pref.label}`);
      }
    }
  }

  // Check if rent is within budget
  if (listing.rent) {
    const rentShare = listing.rent / 3;
    if (constraints.max_rent && rentShare > constraints.max_rent) {
      hasAnyAmber = true;
      amberReasons.push(`₹${rentShare} over budget`);
    }
  }

  // Check if in refused areas
  if (listing.area && constraints.areas_refuse.includes(listing.area)) {
    return 'fail';
  }

  if (hasAnyAmber) {
    return { status: 'amber', reason: amberReasons.join(', ') };
  }

  return 'pass';
}

export function matchListingsToGroup(
  listings: Listing[],
  members: Member[],
  constraintsMap: Record<string, Constraints>
): ListingMatch[] {
  const matches = listings.map((listing) => {
    const personMatches: PersonMatch[] = members.map((member) => {
      const constraints = constraintsMap[member.id];
      if (!constraints) {
        return {
          memberId: member.id,
          memberName: member.name,
          color: member.color,
          status: 'unknown',
        };
      }

      const result = evaluateListingForPerson(listing, constraints);
      const isReason = typeof result === 'object' && 'reason' in result;
      const status = isReason ? result.status : result;
      const reason = isReason ? result.reason : undefined;

      return {
        memberId: member.id,
        memberName: member.name,
        color: member.color,
        status,
        reason,
      };
    });

    // Count compromises (amber seats)
    const compromiseCount = personMatches.filter((m) => m.status === 'amber').length;

    // Check if any person has a hard fail
    const hasFailure = personMatches.some((m) => m.status === 'fail');

    return {
      listing,
      matches: personMatches,
      compromiseCount,
      isBestMatch: false, // Will be set after sorting
    };
  });

  // Sort by: failures last, then by compromise count
  matches.sort((a, b) => {
    const aHasFailure = a.matches.some((m) => m.status === 'fail');
    const bHasFailure = b.matches.some((m) => m.status === 'fail');

    if (aHasFailure && !bHasFailure) return 1;
    if (!aHasFailure && bHasFailure) return -1;

    return a.compromiseCount - b.compromiseCount;
  });

  // Mark the top non-failed listing as best match
  const topMatch = matches.find((m) => !m.matches.some((p) => p.status === 'fail'));
  if (topMatch) {
    topMatch.isBestMatch = true;
  }

  return matches;
}
