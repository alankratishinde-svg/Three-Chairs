'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NameSelect from '@/components/NameSelect';
import FormPage from '@/components/FormPage';
import RankingScreen from '@/components/RankingScreen';
import SummaryScreen from '@/components/SummaryScreen';
import { supabase } from '@/lib/supabase';
import { Member, Listing, Constraints, Ranking } from '@/lib/types';

const DEFAULT_GROUP_ID = '00000000-0000-0000-0000-000000000000';
const MEMBERS_DATA: { name: string; color: Member['color'] }[] = [
  { name: 'Riya', color: 'red' },
  { name: 'Meera', color: 'purple' },
  { name: 'Kavita', color: 'peach' },
];

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingListings, setFetchingListings] = useState(false);
  const [error, setError] = useState('');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fetchTriggered = useRef(false);

  const loadMembers = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', DEFAULT_GROUP_ID)
      .order('created_at');
    if (err) throw err;
    setMembers(data || []);
    return data || [];
  }, []);

  const loadListings = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('listings')
      .select('*')
      .eq('group_id', DEFAULT_GROUP_ID)
      .order('created_at');
    if (err) throw err;
    setListings(data || []);
    return data || [];
  }, []);

  const loadRankings = useCallback(async (listingIds: string[]) => {
    if (listingIds.length === 0) {
      setRankings([]);
      return [] as Ranking[];
    }
    const { data, error: err } = await supabase
      .from('rankings')
      .select('*')
      .in('listing_id', listingIds);
    if (err) throw err;
    setRankings(data || []);
    return data || [];
  }, []);

  const loadEverything = useCallback(async () => {
    const membersData = await loadMembers();
    const listingsData = await loadListings();
    await loadRankings(listingsData.map((l: Listing) => l.id));
    return { membersData, listingsData };
  }, [loadMembers, loadListings, loadRankings]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: existingGroup } = await supabase
          .from('groups')
          .select('*')
          .eq('id', DEFAULT_GROUP_ID)
          .single();

        if (!existingGroup) {
          await supabase.from('groups').insert([
            { id: DEFAULT_GROUP_ID, name: 'Three Chairs Session' },
          ]);

          const memberInserts = MEMBERS_DATA.map((d) => ({
            group_id: DEFAULT_GROUP_ID,
            name: d.name,
            color: d.color,
          }));
          await supabase.from('members').insert(memberInserts);
        }

        await loadEverything();
      } catch (err) {
        console.error('Failed to initialize group:', err);
        setError('Failed to load. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    init();

    const membersSub = supabase
      .channel('members-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `group_id=eq.${DEFAULT_GROUP_ID}` },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    const listingsSub = supabase
      .channel('listings-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings', filter: `group_id=eq.${DEFAULT_GROUP_ID}` },
        async () => {
          const listingsData = await loadListings();
          await loadRankings(listingsData.map((l: Listing) => l.id));
        }
      )
      .subscribe();

    const rankingsSub = supabase
      .channel('rankings-page-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
        setListings((current) => {
          loadRankings(current.map((l) => l.id));
          return current;
        });
      })
      .subscribe();

    return () => {
      membersSub.unsubscribe();
      listingsSub.unsubscribe();
      rankingsSub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSubmitted = members.length > 0 && members.every((m) => m.constraints_submitted);
  const allRanked =
    listings.length > 0 &&
    members.every(
      (m) => rankings.filter((r) => r.member_id === m.id).length === listings.length
    );

  // Fetch the 5 suggested listings once everyone has submitted constraints
  useEffect(() => {
    const fetchListings = async () => {
      if (!allSubmitted || listings.length > 0 || fetchTriggered.current) return;
      fetchTriggered.current = true;
      setFetchingListings(true);
      try {
        // Double-check nobody else already inserted listings for this group
        const existing = await loadListings();
        if (existing.length > 0) return;

        const { data: constraintsData } = await supabase
          .from('constraints')
          .select('*')
          .in('member_id', members.map((m) => m.id));

        const constraintsMap: Record<string, Constraints> = {};
        (constraintsData || []).forEach((c: Constraints) => {
          constraintsMap[c.member_id] = c;
        });

        const response = await fetch('/api/search-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ constraints: constraintsMap, groupId: DEFAULT_GROUP_ID }),
        });
        const data = await response.json();
        const suggested = (data.listings || []).slice(0, 5);

        if (suggested.length > 0) {
          const listingInserts = suggested.map((l: any) => ({
            group_id: DEFAULT_GROUP_ID,
            name: l.name,
            rent: l.rent ?? null,
            area: l.area ?? null,
            floor: l.floor ?? null,
            has_lift: l.has_lift ?? null,
            parking: l.parking ?? null,
            bathrooms: l.bathrooms ?? null,
            pet_friendly: l.pet_friendly ?? null,
            furnishing: l.furnishing ?? null,
            created_by: members[0].id,
          }));
          await supabase.from('listings').insert(listingInserts);
        }

        await loadListings();
      } catch (err) {
        console.error('Failed to fetch suggested listings:', err);
        fetchTriggered.current = false;
      } finally {
        setFetchingListings(false);
      }
    };

    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubmitted, listings.length, members]);

  const handleReset = async () => {
    setConfirmingReset(false);
    setLoading(true);
    try {
      await supabase.from('groups').delete().eq('id', DEFAULT_GROUP_ID);
      await supabase.from('groups').insert([
        { id: DEFAULT_GROUP_ID, name: 'Three Chairs Session' },
      ]);
      const memberInserts = MEMBERS_DATA.map((d) => ({
        group_id: DEFAULT_GROUP_ID,
        name: d.name,
        color: d.color,
      }));
      await supabase.from('members').insert(memberInserts);

      fetchTriggered.current = false;
      setSelectedMemberId(null);
      await loadEverything();
    } catch (err) {
      console.error('Reset failed:', err);
      setError('Reset failed. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink">{error}</p>
      </div>
    );
  }

  const ResetButton = () => (
    <>
      <button
        onClick={() => setConfirmingReset(true)}
        className="fixed top-4 right-4 z-50 text-xs bg-card border-2 border-hairline text-ink px-3 py-2 rounded-lg font-bold uppercase tracking-wider hover:bg-burgundy hover:text-white transition-colors"
      >
        Reset
      </button>

      {confirmingReset && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-cream border-2 border-hairline rounded-xl p-6 max-w-sm w-full">
            <p className="font-bold text-ink mb-2">Reset everything?</p>
            <p className="text-sm text-ink-soft mb-6">
              This clears all three forms, listings, and rankings for everyone. Nobody can undo this.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingReset(false)}
                className="flex-1 px-4 py-2 border-2 border-hairline text-ink font-bold rounded-lg uppercase tracking-wider text-sm hover:bg-bubblegum-pink hover:text-burgundy transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="pill-cta flex-1 text-white font-bold py-2 rounded-full uppercase tracking-wider text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // 1. Someone is filling out the private form
  if (selectedMemberId) {
    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      return (
        <div>
          <ResetButton />
          <FormPage
            groupId={DEFAULT_GROUP_ID}
            memberId={selectedMemberId}
            member={member}
            onSubmit={() => {
              setSelectedMemberId(null);
              loadMembers();
            }}
          />
        </div>
      );
    }
  }

  // 2. Not everyone has submitted yet -> name picker with progress
  if (!allSubmitted) {
    return (
      <div>
        <ResetButton />
        <NameSelect members={members} onSelect={setSelectedMemberId} />
      </div>
    );
  }

  // 3. Everyone submitted, waiting on the 5 suggested listings
  if (listings.length === 0 || fetchingListings) {
    return (
      <div>
        <ResetButton />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-ink">Finding flats that match everyone's answers...</p>
        </div>
      </div>
    );
  }

  // 4. Listings are ready, but not everyone has ranked all 5
  if (!allRanked) {
    return (
      <div>
        <ResetButton />
        <RankingScreen members={members} listings={listings} />
      </div>
    );
  }

  // 5. Everyone has ranked everything -> summary
  return (
    <div>
      <ResetButton />
      <SummaryScreen members={members} listings={listings} onReset={handleReset} />
    </div>
  );
}
