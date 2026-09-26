'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NameSelect from '@/components/NameSelect';
import FormPage from '@/components/FormPage';
import RankingScreen from '@/components/RankingScreen';
import SummaryScreen from '@/components/SummaryScreen';
import VotingScreen from '@/components/VotingScreen';
import SettingsMenu from '@/components/SettingsMenu';
import { supabase } from '@/lib/supabase';
import { Member, Listing, Constraints, Ranking, Vote } from '@/lib/types';

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
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showTop3, setShowTop3] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingListings, setFetchingListings] = useState(false);
  const [error, setError] = useState('');
  const fetchTriggered = useRef(false);
  const backToHuntTriggered = useRef(false);

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

  const loadVotes = useCallback(async (memberIds: string[]) => {
    if (memberIds.length === 0) {
      setVotes([]);
      return [] as Vote[];
    }
    const { data, error: err } = await supabase
      .from('votes')
      .select('*')
      .in('member_id', memberIds);
    if (err) throw err;
    setVotes(data || []);
    return data || [];
  }, []);

  const loadEverything = useCallback(async () => {
    const membersData = await loadMembers();
    const listingsData = await loadListings();
    await loadRankings(listingsData.map((l: Listing) => l.id));
    await loadVotes(membersData.map((m: Member) => m.id));
    return { membersData, listingsData };
  }, [loadMembers, loadListings, loadRankings, loadVotes]);

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

    const votesSub = supabase
      .channel('votes-page-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        setMembers((current) => {
          loadVotes(current.map((m) => m.id));
          return current;
        });
      })
      .subscribe();

    return () => {
      membersSub.unsubscribe();
      listingsSub.unsubscribe();
      rankingsSub.unsubscribe();
      votesSub.unsubscribe();
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
            image_url: l.image_url ?? null,
            source: l.source ?? null,
            source_url: l.source_url ?? null,
            address: l.address ?? null,
            latitude: l.latitude ?? null,
            longitude: l.longitude ?? null,
            photos: l.photos ?? [],
            rent_per_person: l.rent_per_person ?? null,
            bhk: l.bhk ?? null,
            has_balcony: l.has_balcony ?? null,
            gym_nearby: l.gym_nearby ?? null,
            deposit: l.deposit ?? null,
            available_from: l.available_from ?? null,
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

  // The three highest-scoring flats from Final Rankings (lowest total rank
  // score wins). Stable as long as listings/rankings don't change.
  const top3Ids = (() => {
    if (listings.length === 0) return [];
    const score = (listingId: string) =>
      members.reduce((sum, m) => {
        const r = rankings.find((rk) => rk.member_id === m.id && rk.listing_id === listingId);
        return sum + (r?.rank ?? listings.length + 1);
      }, 0);
    return [...listings]
      .sort((a, b) => score(a.id) - score(b.id))
      .slice(0, 3)
      .map((l) => l.id);
  })();

  const anyVotesCast = votes.length > 0;

  const handleVote = async (memberId: string, round: number, listingId: string | null) => {
    const { error: voteError } = await supabase.from('votes').upsert(
      { member_id: memberId, round, listing_id: listingId },
      { onConflict: 'member_id,round' }
    );
    if (voteError) console.error('Failed to cast vote:', voteError);
    await loadVotes(members.map((m) => m.id));
  };

  const handleBackToHunt = useCallback(async () => {
    if (backToHuntTriggered.current) return;
    backToHuntTriggered.current = true;
    try {
      await supabase.from('votes').delete().in('member_id', members.map((m) => m.id));
      await supabase.from('listings').delete().eq('group_id', DEFAULT_GROUP_ID);
      fetchTriggered.current = false;
      setShowTop3(false);
      // Reset local state directly rather than waiting on a realtime
      // round-trip — DELETE payloads can arrive without the filtered
      // column (group_id) unless REPLICA IDENTITY FULL is set, so the
      // subscription filter can silently miss the delete.
      setListings([]);
      setRankings([]);
      setVotes([]);
    } catch (err) {
      console.error('Back to hunt failed:', err);
    } finally {
      backToHuntTriggered.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const handleReset = async () => {
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
      setShowTop3(false);
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

  // 1. Someone is filling out the private form
  if (selectedMemberId) {
    const member = members.find((m) => m.id === selectedMemberId);
    if (member) {
      return (
        <div>
          <SettingsMenu onReset={handleReset} />
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
        <SettingsMenu onReset={handleReset} />
        <NameSelect members={members} onSelect={setSelectedMemberId} />
      </div>
    );
  }

  // 3. Everyone submitted, waiting on the 5 suggested listings
  if (listings.length === 0 || fetchingListings) {
    return (
      <div>
        <SettingsMenu onReset={handleReset} />
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
        <SettingsMenu onReset={handleReset} />
        <RankingScreen members={members} listings={listings} />
      </div>
    );
  }

  // 5. Everyone ranked -> summary, then top 3 + vote
  if (!showTop3 && !anyVotesCast) {
    return (
      <div>
        <SettingsMenu onReset={handleReset} />
        <SummaryScreen members={members} listings={listings} onSeeTop3={() => setShowTop3(true)} />
      </div>
    );
  }

  return (
    <div>
      <SettingsMenu onReset={handleReset} />
      <VotingScreen
        members={members}
        listings={listings}
        rankings={rankings}
        votes={votes}
        top3Ids={top3Ids}
        onVote={handleVote}
        onBackToHunt={handleBackToHunt}
      />
    </div>
  );
}
