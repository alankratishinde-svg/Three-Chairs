import { Constraints, Listing } from './types';

export interface FitResult {
  hardViolations: string[]; // never a "compromise" — always shown in red
  gets: string[]; // soft preferences this listing satisfies
  givesUp: string[]; // soft preferences this listing lacks
  overBudget: boolean;
  budgetDelta: number; // positive = over budget by this much
  refusedArea: boolean;
  verdict: string;
}

const SOFT_LABELS: Record<string, string> = {
  soft_needs_lift: 'a lift',
  soft_needs_parking: 'parking',
  soft_needs_bathrooms_2_plus: '2+ bathrooms',
  soft_pet_friendly: 'pet-friendliness',
  soft_balcony: 'a balcony',
  soft_furnished: 'furnishing',
  soft_gym_nearby: 'a nearby gym',
};

function softListingValue(key: string, listing: Listing): boolean | null {
  switch (key) {
    case 'soft_needs_lift':
      return listing.has_lift;
    case 'soft_needs_parking':
      return listing.parking;
    case 'soft_needs_bathrooms_2_plus':
      return listing.bathrooms === null ? null : listing.bathrooms >= 2;
    case 'soft_pet_friendly':
      return listing.pet_friendly;
    case 'soft_balcony':
      return listing.has_balcony;
    case 'soft_furnished':
      return listing.furnishing === null ? null : listing.furnishing === 'furnished';
    case 'soft_gym_nearby':
      return listing.gym_nearby;
    default:
      return null;
  }
}

export function computeFit(
  memberName: string,
  constraints: Constraints | undefined,
  listing: Listing
): FitResult {
  if (!constraints) {
    return {
      hardViolations: [],
      gets: [],
      givesUp: [],
      overBudget: false,
      budgetDelta: 0,
      refusedArea: false,
      verdict: `${memberName} hasn't filled their form.`,
    };
  }

  const hardViolations: string[] = [];

  const hardChecks: [boolean, boolean | null, string][] = [
    [constraints.hard_needs_lift, listing.has_lift, 'needs a lift'],
    [constraints.hard_needs_parking, listing.parking, 'needs parking'],
    [
      constraints.hard_needs_bathrooms_2_plus,
      listing.bathrooms === null ? null : listing.bathrooms >= 2,
      'needs 2+ bathrooms',
    ],
    [constraints.hard_pet_friendly, listing.pet_friendly, 'needs it pet-friendly'],
  ];
  hardChecks.forEach(([required, has, label]) => {
    if (required && has === false) hardViolations.push(label);
  });

  const refusedArea = !!(listing.area && constraints.areas_refuse.includes(listing.area));
  if (refusedArea) hardViolations.push(`is in ${listing.area}, an area they refused`);

  const gets: string[] = [];
  const givesUp: string[] = [];
  Object.entries(SOFT_LABELS).forEach(([key, label]) => {
    const wants = (constraints as any)[key];
    if (!wants) return;
    const has = softListingValue(key, listing);
    if (has === true) gets.push(label);
    else givesUp.push(label);
  });

  const rentShare = listing.rent_per_person ?? (listing.rent ? Math.round(listing.rent / 3) : null);
  const overBudget = !!(rentShare && constraints.max_rent && rentShare > constraints.max_rent);
  const budgetDelta = overBudget ? rentShare! - constraints.max_rent! : 0;

  const verdictParts: string[] = [];
  if (hardViolations.length > 0) {
    verdictParts.push(`Breaks ${memberName}'s hard no: ${hardViolations.join(', ')}.`);
  } else {
    if (overBudget) verdictParts.push(`${memberName}'s paying ₹${budgetDelta.toLocaleString('en-IN')} over budget.`);
    if (gets.length > 0) verdictParts.push(`${memberName}'s getting ${gets.slice(0, 2).join(' and ')}.`);
    if (givesUp.length > 0) verdictParts.push(`Giving up ${givesUp.slice(0, 2).join(' and ')}.`);
    if (verdictParts.length === 0) verdictParts.push(`Fits ${memberName} just fine.`);
  }

  return {
    hardViolations,
    gets,
    givesUp,
    overBudget,
    budgetDelta,
    refusedArea,
    verdict: verdictParts.join(' '),
  };
}
