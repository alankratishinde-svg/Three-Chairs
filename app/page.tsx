'use client';
// Redeployment trigger with env vars

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NameSelect from '@/components/NameSelect';
import { supabase } from '@/lib/supabase';
import { Member } from '@/lib/types';

const DEFAULT_GROUP_ID = '00000000-0000-0000-0000-000000000000';
const MEMBERS_DATA = [
  { name: 'Riya', color: 'red' },
  { name: 'Meera', color: 'purple' },
  { name: 'Kavita', color: 'peach' },
];

export default function HomePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initGroup = async () => {
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

          const memberInserts = MEMBERS_DATA.map((data) => ({
            group_id: DEFAULT_GROUP_ID,
            name: data.name,
            color: data.color,
          }));

          await supabase.from('members').insert(memberInserts);
        }

        const { data: membersData, error: err } = await supabase
          .from('members')
          .select('*')
          .eq('group_id', DEFAULT_GROUP_ID)
          .order('created_at');

        if (err) throw err;
        setMembers(membersData || []);
      } catch (err) {
        console.error('Failed to initialize group:', err);
        setError('Failed to load. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    initGroup();
  }, []);

  const handleNameSelect = async (memberId: string) => {
    try {
      router.push(`/group/${DEFAULT_GROUP_ID}?member=${memberId}`);
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-burgundy">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-burgundy">{error}</p>
      </div>
    );
  }

  return (
    <NameSelect
      groupId={DEFAULT_GROUP_ID}
      members={members}
      onSelect={handleNameSelect}
    />
  );
}
