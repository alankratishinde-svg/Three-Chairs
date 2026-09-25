'use client';

import { useState, useEffect } from 'react';
import { Constraints } from '@/lib/types';
import { ExtractedListing } from '@/lib/types';

interface SuggestedListingsProps {
  groupId: string;
  constraintsMap: Record<string, Constraints>;
  onListingSelect: (listing: ExtractedListing) => void;
  isLoading?: boolean;
}

export default function SuggestedListings({
  groupId,
  constraintsMap,
  onListingSelect,
  isLoading = false,
}: SuggestedListingsProps) {
  const [listings, setListings] = useState<ExtractedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints: constraintsMap, groupId }),
      });

      if (!response.ok) throw new Error('Failed to search listings');

      const data = await response.json();
      setListings(data.listings || []);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setListings([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bubblegum-pink/20 border-2 border-cherry-red rounded-xl p-6 mt-8">
      <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-4">
        💡 Smart Suggestions
      </p>
      <p className="text-sm text-burgundy mb-4">
        {loading ? 'Searching Housing.com & NoBroker...' : 'We found listings matching your group\'s preferences.'}
      </p>

      {loading && (
        <div className="text-center py-6">
          <p className="text-sm text-burgundy">Fetching from Housing.com and NoBroker...</p>
        </div>
      )}

      {hasSearched && !loading && (
        <div>
          {listings.length > 0 && (
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full px-4 py-2 mb-4 bg-peach text-burgundy rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-cherry-red hover:text-white transition-colors disabled:opacity-50"
            >
              Search Again
            </button>
          )}

          {listings.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {listings.map((listing, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-burgundy rounded-lg p-3 cursor-pointer hover:bg-cream transition-colors"
                  onClick={() => onListingSelect(listing)}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="font-bold text-burgundy text-sm">{listing.name}</p>
                      <p className="text-xs text-burgundy">{listing.area}</p>
                    </div>
                    <span className="text-xs bg-cherry-red text-white px-2 py-1 rounded font-bold">
                      ₹{listing.rent}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap text-xs">
                    {listing.floor && (
                      <span className="bg-lavender text-burgundy px-2 py-1 rounded">
                        Floor {listing.floor}
                      </span>
                    )}
                    {listing.has_lift && (
                      <span className="bg-lavender text-burgundy px-2 py-1 rounded">
                        ✓ Lift
                      </span>
                    )}
                    {listing.parking && (
                      <span className="bg-lavender text-burgundy px-2 py-1 rounded">
                        ✓ Parking
                      </span>
                    )}
                    {listing.pet_friendly && (
                      <span className="bg-lavender text-burgundy px-2 py-1 rounded">
                        ✓ Pets
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-burgundy mt-2">
                    Click to add to shortlist →
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-burgundy text-center py-4">
              No listings found matching your preferences.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
