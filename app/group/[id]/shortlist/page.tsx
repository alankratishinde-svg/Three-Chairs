'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing, Member, Constraints } from '@/lib/types';
import { matchListingsToGroup } from '@/lib/matching';
import PasteBox from '@/components/PasteBox';
import ListingConfirm from '@/components/ListingConfirm';
import ListingCard from '@/components/ListingCard';
import { ExtractedListing } from '@/lib/types';

export default function ShortlistPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [extractedListing, setExtractedListing] = useState<ExtractedListing | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [constraintsMap, setConstraintsMap] = useState<Record<string, Constraints>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('group_id', groupId);

        if (membersError) throw membersError;
        setMembers(membersData);

        const { data: constraintsData, error: constraintsError } = await supabase
          .from('constraints')
          .select('*')
          .in('member_id', membersData.map((m: Member) => m.id));

        if (constraintsError) throw constraintsError;

        const cMap: Record<string, Constraints> = {};
        constraintsData.forEach((c: Constraints) => {
          cMap[c.member_id] = c;
        });
        setConstraintsMap(cMap);

        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('group_id', groupId);

        if (listingsError) throw listingsError;
        setListings(listingsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  const handleListingPasted = async (text: string) => {
    setIsExtracting(true);
    setExtractionError('');
    setExtractedListing(null);

    try {
      const response = await fetch('/api/extract-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract listing');
      }

      const extracted = await response.json();
      setExtractedListing(extracted);
    } catch (err) {
      console.error(err);
      setExtractionError('Failed to extract listing details. Try pasting again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = () => {
    setExtractedListing(null);
    const loadListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('group_id', groupId);

      if (!error) {
        setListings(data);
      }
    };
    loadListings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-4 flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    );
  }

  const matchedListings = matchListingsToGroup(listings, members, constraintsMap);
  const compromiseStats = members.map((member) => {
    const totalCompromises = matchedListings.reduce((sum, match) => {
      const personMatch = match.matches.find((m) => m.memberId === member.id);
      return sum + (personMatch?.status === 'amber' ? 1 : 0);
    }, 0);
    return {
      member,
      totalCompromises,
      totalListings: matchedListings.filter((m) => !m.matches.find((p) => p.memberId === member.id && p.status === 'fail')).length,
    };
  });

  return (
    <div className="min-h-screen bg-cream p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-burgundy mb-8">
          Your Shortlist
        </h1>

        {/* Fairness check */}
        {matchedListings.length > 0 && (
          <div className="bg-lavender border-2 border-burgundy rounded-xl p-6 mb-8">
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-4">
              Fairness check — nobody always gives in
            </p>
            {compromiseStats.map((stat) => (
              <div key={stat.member.id} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-burgundy">{stat.member.name}</span>
                  <span className="text-xs text-burgundy">
                    {stat.totalCompromises} of {stat.totalListings}
                  </span>
                </div>
                <div className="w-full bg-white border border-burgundy rounded-full h-2">
                  <div
                    className="bg-cherry-red rounded-full h-full"
                    style={{
                      width: `${stat.totalListings > 0 ? (stat.totalCompromises / stat.totalListings) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {extractedListing ? (
          <ListingConfirm
            groupId={groupId}
            extracted={extractedListing}
            isLoading={isExtracting}
            onConfirm={handleConfirm}
            onCancel={() => setExtractedListing(null)}
          />
        ) : (
          <PasteBox
            isLoading={isExtracting}
            error={extractionError}
            onPaste={handleListingPasted}
          />
        )}

        {/* Matched listings */}
        {matchedListings.length > 0 && (
          <div className="mt-12">
            {matchedListings.map((match) => (
              <ListingCard key={match.listing.id} match={match} />
            ))}
          </div>
        )}

        {!extractedListing && listings.length === 0 && (
          <div className="mt-12 text-center text-sm text-burgundy">
            Found listings will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
