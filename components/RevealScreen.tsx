'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Constraints, ExtractedListing } from '@/lib/types';
import SuggestedListings from './SuggestedListings';

interface RevealScreenProps {
  groupId: string;
  members: Member[];
}

interface CombinedFilter {
  maxRent: number | null;
  areasRefuse: string[];
}

export default function RevealScreen({ groupId, members }: RevealScreenProps) {
  const [constraints, setConstraints] = useState<Record<string, Constraints | null>>({});
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const [combined, setCombined] = useState<CombinedFilter | null>(null);

  const handleListingSelect = async (listing: ExtractedListing) => {
    try {
      // Save listing to database
      const { error } = await supabase.from('listings').insert({
        group_id: groupId,
        name: listing.name,
        rent: listing.rent,
        area: listing.area,
        floor: listing.floor,
        has_lift: listing.has_lift,
        parking: listing.parking,
        bathrooms: listing.bathrooms,
        pet_friendly: listing.pet_friendly,
        furnishing: listing.furnishing,
      });

      if (error) throw error;

      // Redirect to shortlist
      window.location.href = `/group/${groupId}/shortlist`;
    } catch (err) {
      console.error('Failed to add listing:', err);
      alert('Failed to add listing. Please try again.');
    }
  };

  useEffect(() => {
    const loadConstraints = async () => {
      try {
        const memberIds = members.map((m) => m.id);
        const { data, error } = await supabase
          .from('constraints')
          .select('*')
          .in('member_id', memberIds);

        if (error) throw error;

        const constraintsMap: Record<string, Constraints> = {};
        data.forEach((c: Constraints) => {
          constraintsMap[c.member_id] = c;
        });
        setConstraints(constraintsMap);

        // Calculate combined filters
        if (data.length === 3) {
          const rents = data
            .map((c: Constraints) => c.max_rent)
            .filter((r: number | null) => r !== null) as number[];
          const maxRent = rents.length > 0 ? Math.min(...rents) : null;

          // Union of all refused areas
          const areasRefuse = Array.from(
            new Set(data.flatMap((c: Constraints) => c.areas_refuse || []))
          ) as string[];

          setCombined({ maxRent, areasRefuse });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => setShowReveal(true), 500);
      }
    };

    loadConstraints();
  }, [members]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Reveal Animation */}
        {showReveal && (
          <div className="mb-12 text-center">
            <div className="relative w-48 h-48 mx-auto mb-6">
              {/* Three overlapping circles with a star in the middle */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
              >
                {/* Background stripes */}
                <defs>
                  <pattern
                    id="stripes"
                    patternUnits="userSpaceOnUse"
                    width="8"
                    height="200"
                  >
                    <rect width="4" height="200" fill="#F7C8D4" />
                    <rect x="4" width="4" height="200" fill="white" />
                  </pattern>
                </defs>

                {/* Red circle */}
                <circle cx="70" cy="90" r="50" fill="#C8202F" opacity="0.7" />
                {/* Purple circle */}
                <circle cx="130" cy="90" r="50" fill="#C9C6F6" opacity="0.7" />
                {/* Peach circle */}
                <circle cx="100" cy="140" r="50" fill="#F9B38A" opacity="0.7" />

                {/* Star in center */}
                <path
                  d="M100,70 L105,85 L120,85 L110,95 L115,110 L100,100 L85,110 L90,95 L80,85 L95,85 Z"
                  fill="white"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-fraunces text-burgundy mb-2">
              Here's what all three of you agree on.
            </h1>
          </div>
        )}

        {/* Combined Filters */}
        {combined && (
          <div className="bg-white border-2 border-burgundy rounded-xl p-8 mb-8">
            <div className="space-y-6">
              {combined.maxRent && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
                    Max rent
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-fraunces text-cherry-red">₹{combined.maxRent}</span>
                    <span className="text-burgundy text-sm">per person</span>
                  </div>
                </div>
              )}

              {combined.areasRefuse.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
                    Areas everyone refuses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {combined.areasRefuse.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 bg-cherry-red text-white rounded-full text-sm font-bold"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggested Listings */}
        {Object.keys(constraints).length > 0 && (
          <SuggestedListings
            groupId={groupId}
            constraintsMap={constraints as Record<string, Constraints>}
            onListingSelect={handleListingSelect}
          />
        )}

        {/* Start Adding Flats Button */}
        <div
          onClick={() => {
            const groupId = window.location.pathname.split('/')[2];
            window.location.href = `/group/${groupId}/shortlist`;
          }}
        >
          <button className="w-full bg-cherry-red text-white font-bold py-4 rounded-lg uppercase tracking-wider hover:bg-burgundy transition-colors">
            Start Adding Flats
          </button>
        </div>

        <p className="text-center text-xs text-burgundy mt-6">
          Find listings on Housing.com or NoBroker and paste them below.
        </p>
      </div>
    </div>
  );
}
