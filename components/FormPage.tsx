'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Constraints } from '@/lib/types';

const PUNE_AREAS = [
  'Baner', 'Bavdhan', 'Wagholi', 'Hadapsar', 'Koregaon Park',
  'Viman Nagar', 'Kalyani Nagar', 'Kothrud', 'Shivajinagar',
  'Pune City', 'Deccan', 'Camp', 'Peth', 'Yerawada',
];

const SOFT_PREF_OPTIONS = [
  { key: 'soft_needs_lift', label: 'Lift' },
  { key: 'soft_needs_parking', label: 'Parking' },
  { key: 'soft_needs_bathrooms_2_plus', label: '2+ Bathrooms' },
  { key: 'soft_pet_friendly', label: 'Pet-Friendly' },
  { key: 'soft_balcony', label: 'Balcony' },
  { key: 'soft_furnished', label: 'Furnished' },
  { key: 'soft_gym_nearby', label: 'Gym Nearby' },
];

const HARD_PREF_OPTIONS = [
  { key: 'hard_needs_lift', label: 'Needs a lift' },
  { key: 'hard_needs_parking', label: 'Needs parking' },
  { key: 'hard_needs_bathrooms_2_plus', label: 'At least 2 bathrooms' },
  { key: 'hard_pet_friendly', label: 'Must be pet-friendly' },
];

interface FormPageProps {
  groupId: string;
  memberId: string;
  member: Member;
  onSubmit: () => void;
}

export default function FormPage({ groupId, memberId, member, onSubmit }: FormPageProps) {
  const [maxRent, setMaxRent] = useState('');
  const [areasRefuse, setAreasRefuse] = useState<string[]>([]);
  const [softAreas, setSoftAreas] = useState<string[]>([]);
  const [hardPrefs, setHardPrefs] = useState<Record<string, boolean>>({});
  const [softPrefs, setSoftPrefs] = useState<Record<string, boolean>>({});
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleArea = (area: string) => {
    setAreasRefuse((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleSoftArea = (area: string) => {
    setSoftAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const addCustomArea = () => {
    if (customAreaInput.trim() && !areasRefuse.includes(customAreaInput.trim())) {
      setAreasRefuse((prev) => [...prev, customAreaInput.trim()]);
      setCustomAreaInput('');
    }
  };

  const toggleHardPref = (key: string) => {
    setHardPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSoftPref = (key: string) => {
    setSoftPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!maxRent.trim()) {
      setError('Please enter your max rent');
      return;
    }

    setLoading(true);

    try {
      // Prepare constraints data
      const constraintsData: Record<string, any> = {
        member_id: memberId,
        max_rent: parseInt(maxRent),
        areas_refuse: areasRefuse,
        soft_preferred_areas: softAreas,
      };

      // Add hard preferences
      HARD_PREF_OPTIONS.forEach(({ key }) => {
        constraintsData[key] = hardPrefs[key] || false;
      });

      // Add soft preferences
      SOFT_PREF_OPTIONS.forEach(({ key }) => {
        constraintsData[key] = softPrefs[key] || false;
      });

      // Insert or update constraints
      const { error: constraintError } = await supabase
        .from('constraints')
        .upsert(constraintsData, { onConflict: 'member_id' });

      if (constraintError) throw constraintError;

      // Mark member as submitted
      const { error: memberError } = await supabase
        .from('members')
        .update({
          constraints_submitted: true,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (memberError) throw memberError;

      onSubmit();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-burgundy mb-2">
          What's your ideal flat, {member.name}?
        </h1>
        <p className="text-sm text-burgundy mb-8">(Only you see this right now)</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rent */}
          <div className="bg-white border-2 border-burgundy rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider text-burgundy font-bold mb-4">
              Rent you can pay without panicking
            </label>
            <div className="flex items-center gap-2">
              <span className="text-burgundy">₹</span>
              <input
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                placeholder="Your monthly share"
                className="flex-1 px-4 py-2 border border-burgundy rounded-lg text-burgundy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cherry-red"
              />
              <span className="text-burgundy text-sm">/ month</span>
            </div>
          </div>

          {/* Areas to avoid */}
          <div className="bg-white border-2 border-burgundy rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider text-burgundy font-bold mb-4">
              Areas you'd refuse to live in
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PUNE_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                    areasRefuse.includes(area)
                      ? 'bg-cherry-red text-white'
                      : 'bg-bubblegum-pink text-burgundy border border-burgundy'
                  }`}
                >
                  ✕ {area}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAreaInput}
                onChange={(e) => setCustomAreaInput(e.target.value)}
                placeholder="Add another area"
                className="flex-1 px-4 py-2 border border-burgundy rounded-lg text-burgundy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cherry-red"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArea();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomArea}
                className="px-4 py-2 bg-bubblegum-pink text-burgundy border border-burgundy rounded-lg font-bold uppercase tracking-wider hover:bg-cherry-red hover:text-white transition-colors"
              >
                Add
              </button>
            </div>
            {areasRefuse.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {areasRefuse.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() =>
                      setAreasRefuse((prev) => prev.filter((a) => a !== area))
                    }
                    className="px-3 py-1 rounded-full text-sm font-bold bg-cherry-red text-white"
                  >
                    ✓ {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hard dealbreakers */}
          <div className="bg-burgundy text-white rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider font-bold mb-4">
              What would make you move out in month 2?
            </label>
            <p className="text-sm mb-4 opacity-90">Your hard no's. We never bend these.</p>
            <div className="space-y-3">
              {HARD_PREF_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hardPrefs[key] || false}
                    onChange={() => toggleHardPref(key)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Soft preferences */}
          <div className="bg-white border-2 border-burgundy rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider text-burgundy font-bold mb-4">
              Nice, but you'd survive without it
            </label>
            <div className="space-y-3 mb-6">
              {SOFT_PREF_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={softPrefs[key] || false}
                    onChange={() => toggleSoftPref(key)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span className="text-sm font-bold text-burgundy">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-burgundy font-bold mb-3">
                Preferred areas (if you have any)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PUNE_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleSoftArea(area)}
                    className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                      softAreas.includes(area)
                        ? 'bg-lavender text-burgundy'
                        : 'bg-bubblegum-pink text-burgundy border border-burgundy'
                    }`}
                  >
                    {softAreas.includes(area) ? '♥' : '+'} {area}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-bubblegum-pink text-burgundy rounded-lg text-sm font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cherry-red text-white font-bold py-4 rounded-lg uppercase tracking-wider hover:bg-burgundy transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Lock in my answers'}
          </button>
        </form>
      </div>
    </div>
  );
}
