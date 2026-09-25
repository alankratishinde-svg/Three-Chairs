export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  color: 'red' | 'purple' | 'peach';
  constraints_submitted: boolean;
  submitted_at: string | null;
  created_at: string;
}

export interface Constraints {
  id: string;
  member_id: string;
  max_rent: number | null;
  areas_refuse: string[];
  hard_needs_lift: boolean;
  hard_needs_parking: boolean;
  hard_needs_bathrooms_2_plus: boolean;
  hard_pet_friendly: boolean;
  soft_needs_lift: boolean;
  soft_needs_parking: boolean;
  soft_needs_bathrooms_2_plus: boolean;
  soft_pet_friendly: boolean;
  soft_balcony: boolean;
  soft_furnished: boolean;
  soft_gym_nearby: boolean;
  soft_preferred_areas: string[];
  created_at: string;
}

export interface Listing {
  id: string;
  group_id: string;
  name: string;
  rent: number | null;
  area: string | null;
  floor: number | null;
  has_lift: boolean | null;
  parking: boolean | null;
  bathrooms: number | null;
  pet_friendly: boolean | null;
  furnishing: 'furnished' | 'semi-furnished' | 'unfurnished' | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export interface Ranking {
  id: string;
  listing_id: string;
  member_id: string;
  rank: number;
  created_at: string;
}

export interface Reaction {
  id: string;
  listing_id: string;
  member_id: string;
  reaction: 'in' | 'live' | 'pass';
  created_at: string;
}

export interface ExtractedListing {
  name: string;
  rent: number | null;
  area: string | null;
  floor: number | null;
  has_lift: boolean | null;
  parking: boolean | null;
  bathrooms: number | null;
  pet_friendly: boolean | null;
  furnishing: 'furnished' | 'semi-furnished' | 'unfurnished' | null;
}
