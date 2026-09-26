'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Constraints, Listing, Member } from '@/lib/types';
import { computeFit } from '@/lib/matchFit';

interface FlatDetailsSheetProps {
  listing: Listing;
  members: Member[];
  onClose: () => void;
}

function formatRent(listing: Listing) {
  if (!listing.rent) return 'Not listed';
  const total = listing.rent.toLocaleString('en-IN');
  const each = listing.rent_per_person
    ? listing.rent_per_person.toLocaleString('en-IN')
    : Math.round(listing.rent / 3).toLocaleString('en-IN');
  return `₹${total}/mo · ₹${each} each`;
}

const SPEC_CHIPS: { key: keyof Listing; label: (l: Listing) => string | null }[] = [
  { key: 'bhk', label: (l) => l.bhk },
  { key: 'floor', label: (l) => (l.floor !== null ? `Floor ${l.floor}` : null) },
  { key: 'bathrooms', label: (l) => (l.bathrooms !== null ? `${l.bathrooms} bath` : null) },
  { key: 'furnishing', label: (l) => l.furnishing },
  { key: 'has_lift', label: (l) => (l.has_lift === null ? null : l.has_lift ? 'Lift' : 'No lift') },
  { key: 'parking', label: (l) => (l.parking === null ? null : l.parking ? 'Parking' : 'No parking') },
  { key: 'pet_friendly', label: (l) => (l.pet_friendly === null ? null : l.pet_friendly ? 'Pet-friendly' : 'Not pet-friendly') },
  { key: 'has_balcony', label: (l) => (l.has_balcony === null ? null : l.has_balcony ? 'Balcony' : 'No balcony') },
  { key: 'gym_nearby', label: (l) => (l.gym_nearby === null ? null : l.gym_nearby ? 'Gym nearby' : null) },
  { key: 'deposit', label: (l) => (l.deposit !== null ? `₹${l.deposit.toLocaleString('en-IN')} deposit` : null) },
  { key: 'available_from', label: (l) => (l.available_from ? `Available ${l.available_from}` : null) },
];

export default function FlatDetailsSheet({ listing, members, onClose }: FlatDetailsSheetProps) {
  const [constraintsMap, setConstraintsMap] = useState<Record<string, Constraints>>({});
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('constraints')
        .select('*')
        .in('member_id', members.map((m) => m.id));
      const map: Record<string, Constraints> = {};
      (data || []).forEach((c: Constraints) => {
        map[c.member_id] = c;
      });
      setConstraintsMap(map);
    };
    load();
  }, [members]);

  const photos = listing.photos.length > 0 ? listing.photos : listing.image_url ? [listing.image_url] : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="bg-cream border-2 border-hairline rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex justify-end p-2 bg-cream/95 backdrop-blur">
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center bg-card border border-hairline rounded-full text-ink"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Photo carousel */}
          {photos.length > 0 ? (
            <div className="relative mb-4">
              <img
                src={photos[photoIndex]}
                alt={listing.name}
                className="w-full h-52 object-cover rounded-xl border border-hairline"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-52 rounded-xl border border-hairline bg-card flex items-center justify-center text-4xl mb-4">
              🏠
            </div>
          )}

          <h2 className="text-2xl font-fraunces text-ink mb-1">{listing.name}</h2>
          <p className="text-lg font-bold text-ink mb-1">{formatRent(listing)}</p>
          <p className="text-sm text-ink-soft mb-1">{listing.address || listing.area || 'Not listed'}</p>

          {listing.latitude && listing.longitude && (
            <a
              href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cherry-red underline"
            >
              Open in Google Maps ↗
            </a>
          )}

          {/* Spec chips */}
          <div className="flex flex-wrap gap-2 mt-5 mb-5">
            {SPEC_CHIPS.map(({ key, label }) => {
              const text = label(listing);
              if (!text) return null;
              return (
                <span
                  key={key}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-card border border-hairline text-ink capitalize"
                >
                  {text}
                </span>
              );
            })}
          </div>

          {/* Source badge */}
          <div className="flex items-center justify-between bg-card border border-hairline rounded-lg px-4 py-3 mb-6">
            <span className="text-xs text-ink-soft">Found on {listing.source || 'housing.com'}</span>
            {listing.source_url && (
              <a
                href={listing.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-cherry-red underline"
              >
                View original listing ↗
              </a>
            )}
          </div>

          {/* Match check per person */}
          <p className="text-xs uppercase tracking-wider text-ink-soft font-bold mb-3">
            How it fits everyone
          </p>
          <div className="space-y-2">
            {members.map((member) => {
              const fit = computeFit(member.name, constraintsMap[member.id], listing);
              return (
                <div key={member.id} className="text-sm">
                  <span className="font-bold text-ink">{member.name}: </span>
                  {fit.hardViolations.length > 0 ? (
                    <span className="text-cherry-red font-bold">
                      ❌ {fit.hardViolations.join(', ')} (her hard no)
                    </span>
                  ) : (
                    <span className="text-ink-soft">
                      {fit.overBudget ? '❌ over budget · ' : '✅ fits budget · '}
                      {fit.gets.map((g) => `✅ has ${g}`).join(' · ')}
                      {fit.gets.length > 0 && fit.givesUp.length > 0 ? ' · ' : ''}
                      {fit.givesUp.map((g) => `❌ no ${g}`).join(' · ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
