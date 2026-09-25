-- Three Chairs Database Schema
-- Run this in your Supabase SQL editor

-- Groups table: stores the groups of three flatmates
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Members table: stores the three people in each group
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- 'red' (Riya), 'purple' (Meera), 'peach' (Kavita)
  constraints_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, name)
);

-- Constraints table: stores the hard and soft preferences for each person
CREATE TABLE constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  max_rent INTEGER, -- max monthly rent share in rupees
  areas_refuse TEXT[] DEFAULT ARRAY[]::TEXT[], -- array of area names to avoid

  -- Hard dealbreakers (must haves)
  hard_needs_lift BOOLEAN DEFAULT FALSE,
  hard_needs_parking BOOLEAN DEFAULT FALSE,
  hard_needs_bathrooms_2_plus BOOLEAN DEFAULT FALSE,
  hard_pet_friendly BOOLEAN DEFAULT FALSE,

  -- Soft preferences
  soft_needs_lift BOOLEAN DEFAULT FALSE,
  soft_needs_parking BOOLEAN DEFAULT FALSE,
  soft_needs_bathrooms_2_plus BOOLEAN DEFAULT FALSE,
  soft_pet_friendly BOOLEAN DEFAULT FALSE,
  soft_balcony BOOLEAN DEFAULT FALSE,
  soft_furnished BOOLEAN DEFAULT FALSE,
  soft_gym_nearby BOOLEAN DEFAULT FALSE,
  soft_preferred_areas TEXT[] DEFAULT ARRAY[]::TEXT[], -- preferred areas

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id)
);

-- Listings table: stores flats that have been added to the group
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- flat name/address
  rent INTEGER, -- total monthly rent
  area TEXT,
  floor INTEGER,
  has_lift BOOLEAN,
  parking BOOLEAN,
  bathrooms INTEGER,
  pet_friendly BOOLEAN,
  furnishing TEXT, -- 'furnished', 'semi-furnished', 'unfurnished', null
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reactions table: stores which people like/dislike each listing
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL, -- 'in' (I'm in), 'live' (I can live with it), 'pass' (Hard pass)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, member_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_members_group_id ON members(group_id);
CREATE INDEX idx_constraints_member_id ON constraints(member_id);
CREATE INDEX idx_listings_group_id ON listings(group_id);
CREATE INDEX idx_reactions_listing_id ON reactions(listing_id);
CREATE INDEX idx_reactions_member_id ON reactions(member_id);
