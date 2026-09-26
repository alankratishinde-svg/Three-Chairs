'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Constraints } from '@/lib/types';

const POPULAR_AREAS = [
  'Baner', 'Koregaon Park', 'Viman Nagar', 'Kothrud', 'Shivajinagar',
];

const MORE_AREAS = [
  'Bavdhan', 'Wagholi', 'Hadapsar', 'Kalyani Nagar',
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
  const [showMoreAreas, setShowMoreAreas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allAreas = showMoreAreas ? [...POPULAR_AREAS, ...MORE_AREAS] : POPULAR_AREAS;

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
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-fraunces text-ink mb-2">
          What's your ideal flat, {member.name}?
        </h1>
        <p className="text-sm text-ink-soft mb-8">(Only you see this right now)</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rent — the first, most important decision */}
          <div className="bg-card border-2 border-cherry-red rounded-xl p-6 shadow-[0_0_30px_-12px_rgba(200,32,47,0.5)]">
            <label className="block text-sm uppercase tracking-wider text-ink-soft font-bold mb-4">
              Rent you can pay without panicking
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-ink">₹</span>
              <input
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                placeholder="Your monthly share"
                className="flex-1 px-4 py-3 border border-hairline rounded-lg text-2xl font-bold text-ink bg-transparent placeholder-ink-soft/40 placeholder:text-base placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-cherry-red"
              />
              <span className="text-ink-soft text-sm">/ month</span>
            </div>
          </div>

          {/* Areas to avoid */}
          <div className="bg-card border-2 border-hairline rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider text-ink-soft font-bold mb-4">
              Areas you'd refuse to live in
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {allAreas.map((area) => (
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
            <button
              type="button"
              onClick={() => setShowMoreAreas((prev) => !prev)}
              className="text-xs text-ink-soft underline mb-4"
            >
              {showMoreAreas ? 'Show fewer areas' : 'Show more areas'}
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAreaInput}
                onChange={(e) => setCustomAreaInput(e.target.value)}
                placeholder="Add another area"
                className="flex-1 px-4 py-2 border border-hairline rounded-lg text-ink bg-transparent placeholder-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-cherry-red"
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
            <div className="flex flex-wrap gap-2">
              {HARD_PREF_OPTIONS.map(({ key, label }) => {
                const active = hardPrefs[key] || false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleHardPref(key)}
                    aria-pressed={active}
                    className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border-2 transition-colors ${
                      active
                        ? 'bg-white text-burgundy border-white'
                        : 'bg-transparent text-white border-white/40 hover:border-white'
                    }`}
                  >
                    {active ? '✓ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Soft preferences */}
          <div className="bg-card border-2 border-hairline rounded-xl p-6">
            <label className="block text-sm uppercase tracking-wider text-ink-soft font-bold mb-4">
              Nice, but you'd survive without it
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {SOFT_PREF_OPTIONS.map(({ key, label }) => {
                const active = softPrefs[key] || false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSoftPref(key)}
                    aria-pressed={active}
                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
                      active
                        ? 'bg-lavender text-burgundy border-lavender'
                        : 'bg-transparent text-ink border-hairline hover:border-lavender'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-soft font-bold mb-3">
                Preferred areas (if you have any)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allAreas.map((area) => (
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
            className="pill-cta w-full text-white font-bold py-4 rounded-full uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Lock in my answers'}
          </button>
        </form>
      </div>
    </div>
  );
}
