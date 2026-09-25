'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Member, Group } from '@/lib/types';
import NameSelect from '@/components/NameSelect';
import FormPage from '@/components/FormPage';
import WaitingScreen from '@/components/WaitingScreen';
import RevealScreen from '@/components/RevealScreen';

type PageState = 'select' | 'form' | 'waiting' | 'reveal';

export default function GroupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.id as string;
  const memberParam = searchParams.get('member');

  const [pageState, setPageState] = useState<PageState>('select');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(memberParam);
  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('group_id', groupId);

        if (membersError) throw membersError;
        setMembers(membersData);

        // Check if all have submitted
        const allSubmitted = membersData?.every((m: Member) => m.constraints_submitted);
        if (allSubmitted && !memberParam) {
          setPageState('reveal');
        } else if (memberParam) {
          setPageState('form');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGroup();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('group-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `group_id=eq.${groupId}` },
        (payload: any) => {
          setMembers((prev: Member[]) => {
            const newMember = payload.new as Member;
            const updated = prev.map((m) =>
              m.id === newMember.id ? newMember : m
            );

            // Check if all submitted
            if (updated.every((m: Member) => m.constraints_submitted)) {
              setPageState('reveal');
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId, memberParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-burgundy">Group not found</p>
      </div>
    );
  }

  return (
    <div>
      {pageState === 'select' && (
        <NameSelect
          groupId={groupId}
          members={members}
          onSelect={(memberId) => {
            setSelectedMemberId(memberId);
            setPageState('form');
          }}
        />
      )}

      {pageState === 'form' && selectedMemberId && (
        <FormPage
          groupId={groupId}
          memberId={selectedMemberId}
          member={members.find(m => m.id === selectedMemberId)!}
          onSubmit={() => {
            setPageState('waiting');
          }}
        />
      )}

      {pageState === 'waiting' && (
        <WaitingScreen
          groupId={groupId}
          members={members}
        />
      )}

      {pageState === 'reveal' && (
        <RevealScreen
          groupId={groupId}
          members={members}
        />
      )}
    </div>
  );
}
