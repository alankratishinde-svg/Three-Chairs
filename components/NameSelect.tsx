'use client';

import { Member } from '@/lib/types';

interface NameSelectProps {
  members: Member[];
  onSelect: (memberId: string) => void;
}

export default function NameSelect({ members, onSelect }: NameSelectProps) {
  const submittedCount = members.filter((m) => m.constraints_submitted).length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bagel text-center mb-2 text-ink">three chairs</h1>
        <p className="text-center text-sm text-ink-soft mb-4">Pick your name</p>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs uppercase tracking-wider text-ink-soft font-bold">
              Forms filled
            </span>
            <span className="text-xs font-bold text-ink">{submittedCount} / {members.length}</span>
          </div>
          <div className="w-full bg-card border border-hairline rounded-full h-2">
            <div
              className="bg-cherry-red rounded-full h-full transition-all"
              style={{ width: `${(submittedCount / members.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const done = member.constraints_submitted;
            return (
              <button
                key={member.id}
                onClick={() => !done && onSelect(member.id)}
                disabled={done}
                className={`w-full py-4 px-6 rounded-lg border-2 border-hairline font-bold uppercase tracking-wider transition-transform flex items-center justify-between ${
                  done
                    ? 'bg-card text-ink-soft opacity-60 cursor-not-allowed'
                    : `text-white hover:scale-105 border-transparent ${
                        member.color === 'red' ? 'bg-riya hover:bg-cherry-red' :
                        member.color === 'purple' ? 'bg-meera hover:bg-lavender' :
                        'bg-kavita hover:bg-peach'
                      }`
                }`}
              >
                <span>{member.name}</span>
                {done && <span>✓ Done</span>}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-ink-soft mt-8">
          Fill the form privately. Nobody sees your answers until everyone's done.
        </p>
      </div>
    </div>
  );
}
