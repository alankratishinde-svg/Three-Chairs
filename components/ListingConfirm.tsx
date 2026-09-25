'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ExtractedListing } from '@/lib/types';

interface ListingConfirmProps {
  groupId: string;
  extracted: ExtractedListing;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ListingConfirm({
  groupId,
  extracted,
  isLoading,
  onConfirm,
  onCancel,
}: ListingConfirmProps) {
  const [data, setData] = useState(extracted);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please give this flat a name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // For now, just get the current user's member ID from the group
      // In a real app, you'd track which member is logged in
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('group_id', groupId)
        .limit(1);

      if (membersError || !members?.length) throw new Error('Could not find member');

      const { error: listingError } = await supabase
        .from('listings')
        .insert([
          {
            group_id: groupId,
            ...data,
            name: name.trim(),
            created_by: members[0].id,
          },
        ]);

      if (listingError) throw listingError;

      // Reset and show success
      setName('');
      setData(extracted);
      onConfirm();
    } catch (err) {
      console.error(err);
      setError('Failed to save listing. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-2 border-burgundy rounded-xl p-8 mb-8">
      <h2 className="text-2xl font-fraunces text-burgundy mb-6">
        Did we get this right?
      </h2>

      {/* Flat Name */}
      <div className="mb-6">
        <label className="block text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
          Flat name / address
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 3BHK, Baner"
          className="w-full px-4 py-2 border border-burgundy rounded-lg text-burgundy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cherry-red"
        />
      </div>

      {/* Extracted Fields as Chips */}
      <div className="space-y-4 mb-6">
        {/* Rent */}
        {data.rent && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Rent
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full font-bold">
                ₹{data.rent}/month
              </span>
              <button
                onClick={() => setData({ ...data, rent: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Area */}
        {data.area && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Area
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full font-bold">
                {data.area}
              </span>
              <button
                onClick={() => setData({ ...data, area: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Floor */}
        {data.floor && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Floor
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full font-bold">
                Floor {data.floor}
              </span>
              <button
                onClick={() => setData({ ...data, floor: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Has Lift */}
        {data.has_lift !== null && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Lift
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full font-bold ${data.has_lift ? 'bg-lavender text-burgundy' : 'bg-bubblegum-pink text-burgundy'}`}>
                {data.has_lift ? '✓ Has lift' : '✕ No lift'}
              </span>
              <button
                onClick={() => setData({ ...data, has_lift: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Parking */}
        {data.parking !== null && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Parking
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full font-bold ${data.parking ? 'bg-lavender text-burgundy' : 'bg-bubblegum-pink text-burgundy'}`}>
                {data.parking ? '✓ Has parking' : '✕ No parking'}
              </span>
              <button
                onClick={() => setData({ ...data, parking: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Bathrooms */}
        {data.bathrooms && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Bathrooms
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full font-bold">
                {data.bathrooms} bathroom{data.bathrooms !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setData({ ...data, bathrooms: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Pet Friendly */}
        {data.pet_friendly !== null && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Pets
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full font-bold ${data.pet_friendly ? 'bg-lavender text-burgundy' : 'bg-bubblegum-pink text-burgundy'}`}>
                {data.pet_friendly ? '✓ Pet-friendly' : '✕ No pets'}
              </span>
              <button
                onClick={() => setData({ ...data, pet_friendly: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Furnishing */}
        {data.furnishing && (
          <div>
            <p className="text-xs uppercase tracking-wider text-burgundy font-bold mb-2">
              Furnishing
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-bubblegum-pink text-burgundy rounded-full font-bold capitalize">
                {data.furnishing}
              </span>
              <button
                onClick={() => setData({ ...data, furnishing: null })}
                className="text-xs text-burgundy hover:text-cherry-red"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-bubblegum-pink text-burgundy rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={saving || isLoading}
          className="flex-1 px-4 py-3 border-2 border-burgundy text-burgundy font-bold rounded-lg uppercase tracking-wider hover:bg-bubblegum-pink transition-colors disabled:opacity-50"
        >
          Try Again
        </button>
        <button
          onClick={handleSave}
          disabled={saving || isLoading || !name.trim()}
          className="flex-1 bg-cherry-red text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-burgundy transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Looks Good!'}
        </button>
      </div>

      <p className="text-xs text-burgundy mt-4">
        You can edit or remove fields above before saving.
      </p>
    </div>
  );
}
