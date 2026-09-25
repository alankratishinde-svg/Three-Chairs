'use client';

import { Member } from '@/lib/types';

const colorMap = {
  red: 'border-riya',
  purple: 'border-meera',
  peach: 'border-kavita',
};

const bgColorMap = {
  red: 'bg-riya',
  purple: 'bg-meera',
  peach: 'bg-kavita',
};

interface WaitingScreenProps {
  groupId: string;
  members: Member[];
}

export default function WaitingScreen({ groupId, members }: WaitingScreenProps) {
  const submitted = members.filter((m) => m.constraints_submitted);
  const pendingMember = members.find((m) => !m.constraints_submitted);

  const handleWhatsApp = (name: string) => {
    const text = `Hey ${name}! Fill in your flat preferences so we can find something everyone loves. Link: ${window.location.href}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h2 className="text-3xl font-fraunces text-burgundy mb-2">
          {submitted.length} of 3 in
        </h2>
        <p className="text-sm text-burgundy mb-8">Taking a minute...</p>

        {/* Avatars */}
        <div className="flex justify-center gap-4 mb-12">
          {members.map((member) => (
            <div
              key={member.id}
              className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                member.constraints_submitted
                  ? `${bgColorMap[member.color as keyof typeof bgColorMap]} text-white`
                  : 'bg-white border-dashed border-burgundy text-burgundy'
              }`}
            >
              <span className="font-bold text-sm uppercase text-center px-2">
                {member.name.substring(0, 3)}
              </span>
            </div>
          ))}
        </div>

        {pendingMember && (
          <div>
            <p className="text-xs text-burgundy mb-6 italic font-caveat text-lg">
              No peeking till {pendingMember.name}'s done!
            </p>

            <button
              onClick={() => handleWhatsApp(pendingMember.name)}
              className="w-full bg-cherry-red text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-burgundy transition-colors mb-4"
            >
              Nudge {pendingMember.name} on WhatsApp
            </button>
          </div>
        )}

        <p className="text-xs text-burgundy">
          {submitted.length === 3 ? "Everyone's in! The reveal is coming..." : "Waiting..."}
        </p>
      </div>
    </div>
  );
}
