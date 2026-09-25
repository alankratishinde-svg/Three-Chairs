'use client';

import { Member } from '@/lib/types';

interface NameSelectProps {
  groupId: string;
  members: Member[];
  onSelect: (memberId: string) => void;
}

const colorMap = {
  red: 'bg-riya',
  purple: 'bg-meera',
  peach: 'bg-kavita',
};

export default function NameSelect({ members, onSelect }: NameSelectProps) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bagel text-center mb-2 text-burgundy">three chairs</h1>
        <p className="text-center text-sm text-burgundy mb-8">Pick your name</p>

        <div className="space-y-3">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member.id)}
              className={`w-full py-4 px-6 rounded-lg border-2 border-burgundy font-bold uppercase tracking-wider text-white transition-transform hover:scale-105 ${
                member.color === 'red' ? 'bg-riya hover:bg-cherry-red' :
                member.color === 'purple' ? 'bg-meera hover:bg-lavender' :
                'bg-kavita hover:bg-peach'
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-burgundy mt-8">
          Fill the form privately. Nobody sees your answers until everyone's done.
        </p>
      </div>
    </div>
  );
}
