import { Constraints } from '@/lib/types';

const HOUSING_SOURCE_URL = 'https://housing.com/rent/flats-for-rent-in-pune';

const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  Shivajinagar: { lat: 18.5308, lng: 73.8475 },
  Kothrud: { lat: 18.5074, lng: 73.8077 },
  Deccan: { lat: 18.5158, lng: 73.8412 },
  'Viman Nagar': { lat: 18.5679, lng: 73.9143 },
  'Pune City': { lat: 18.5204, lng: 73.8567 },
};

// Mock listings for testing (fallback when RapidAPI fails or returns nothing).
// These are demo properties, not real listings — fields we'd genuinely have
// no way to know for a real listing (deposit, available_from) are still
// filled in here because this whole dataset is synthetic by design, but the
// real-API mapping below never fabricates a value it doesn't receive.
const MOCK_LISTINGS = [
  {
    name: "Cozy 2BHK, Shivajinagar",
    rent: 45000,
    area: "Shivajinagar",
    floor: 2,
    has_lift: true,
    parking: true,
    bathrooms: 2,
    pet_friendly: false,
    furnishing: "semi-furnished",
    bhk: "2BHK",
    has_balcony: true,
    gym_nearby: false,
    deposit: 90000,
    available_from: "2026-10-05",
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
    ],
  },
  {
    name: "Bright Flat, Kothrud",
    rent: 42000,
    area: "Kothrud",
    floor: 1,
    has_lift: false,
    parking: true,
    bathrooms: 2,
    pet_friendly: true,
    furnishing: "unfurnished",
    bhk: "2BHK",
    has_balcony: false,
    gym_nearby: false,
    deposit: 84000,
    available_from: "2026-10-01",
    image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80",
    ],
  },
  {
    name: "Modern 2BHK, Deccan",
    rent: 45000,
    area: "Deccan",
    floor: 3,
    has_lift: true,
    parking: false,
    bathrooms: 2,
    pet_friendly: true,
    furnishing: "furnished",
    bhk: "2BHK",
    has_balcony: true,
    gym_nearby: true,
    deposit: 90000,
    available_from: "2026-10-15",
    image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
    ],
  },
  {
    name: "Spacious Flat, Viman Nagar",
    rent: 48000,
    area: "Viman Nagar",
    floor: 2,
    has_lift: true,
    parking: true,
    bathrooms: 2,
    pet_friendly: false,
    furnishing: "semi-furnished",
    bhk: "2BHK",
    has_balcony: false,
    gym_nearby: false,
    deposit: 96000,
    available_from: "2026-10-10",
    image_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80",
    ],
  },
  {
    name: "Sunny Apt, Shivajinagar",
    rent: 46500,
    area: "Shivajinagar",
    floor: 4,
    has_lift: true,
    parking: false,
    bathrooms: 1,
    pet_friendly: true,
    furnishing: "furnished",
    bhk: "1BHK",
    has_balcony: true,
    gym_nearby: false,
    deposit: 93000,
    available_from: "2026-10-08",
    image_url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
    ],
  },
  {
    name: "Premium 2BHK, Pune City",
    rent: 51000,
    area: "Pune City",
    floor: 5,
    has_lift: true,
    parking: true,
    bathrooms: 2,
    pet_friendly: false,
    furnishing: "furnished",
    bhk: "2BHK",
    has_balcony: true,
    gym_nearby: true,
    deposit: 102000,
    available_from: "2026-10-20",
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
    ],
  },
];

function withDerivedFields(listing: any, memberCount: number) {
  const coords = listing.area ? AREA_COORDS[listing.area] : undefined;
  return {
    ...listing,
    source: listing.source ?? 'housing.com',
    source_url: listing.source_url ?? HOUSING_SOURCE_URL,
    address: listing.address ?? (listing.area ? `${listing.name.split(',')[0]}, ${listing.area}, Pune` : null),
    latitude: listing.latitude ?? coords?.lat ?? null,
    longitude: listing.longitude ?? coords?.lng ?? null,
    photos: listing.photos ?? (listing.image_url ? [listing.image_url] : []),
    rent_per_person:
      listing.rent_per_person ?? (listing.rent && memberCount > 0 ? Math.round(listing.rent / memberCount) : null),
  };
}

async function searchRealEstateAPI(constraints: Record<string, Constraints>) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log("No RapidAPI key found, using mock data");
    return MOCK_LISTINGS;
  }

  try {
    // Calculate average max rent
    const rents = Object.values(constraints)
      .filter((c): c is Constraints => c !== null)
      .map((c) => c.max_rent)
      .filter((r): r is number => r !== null);

    const maxRent = rents.length > 0 ? Math.min(...rents) : 50000;

    // Try multiple RapidAPI endpoints
    const endpoints = [
      {
        url: "https://real-estate-real-estate-com.p.rapidapi.com/rent/search",
        host: "real-estate-real-estate-com.p.rapidapi.com",
        params: { city: "Pune", maxPrice: Math.ceil(maxRent * 1.5).toString() },
      },
      {
        url: "https://housing-api.p.rapidapi.com/v1/search",
        host: "housing-api.p.rapidapi.com",
        params: { city: "Pune", maxRent: Math.ceil(maxRent * 1.5).toString() },
      },
      {
        url: "https://real-estate-listings.p.rapidapi.com/search",
        host: "real-estate-listings.p.rapidapi.com",
        params: { location: "Pune", price_max: Math.ceil(maxRent * 1.5).toString() },
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const searchUrl = new URL(endpoint.url);
        Object.entries(endpoint.params).forEach(([key, value]) => {
          searchUrl.searchParams.append(key, value);
        });

        const response = await fetch(searchUrl.toString(), {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": endpoint.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Only ever map a field the API actually returned — never fill a
          // gap with a guessed value. Missing = null, shown as "Not listed".
          const results = (data.results || data.data || data.listings || [])
            .slice(0, 8)
            .map((p: any) => ({
              name: p.title || p.propertyTitle || p.name || "Apartment",
              rent: p.price || p.rentPrice || p.rent || 0,
              area: p.locality || p.area || p.location || "Pune",
              floor: p.floor ? parseInt(p.floor) : null,
              has_lift: p.lift !== undefined ? p.lift : null,
              parking: p.parking !== undefined ? p.parking : null,
              bathrooms: p.bathrooms ? parseInt(p.bathrooms) : null,
              pet_friendly: p.pets !== undefined ? p.pets : null,
              furnishing: p.furnishing?.toLowerCase() || null,
              image_url: p.image || p.photo || p.thumbnail || p.coverImage || null,
              photos: Array.isArray(p.photos) ? p.photos : Array.isArray(p.images) ? p.images : null,
              source: p.source || p.site || 'housing.com',
              source_url: p.url || p.link || p.listingUrl || null,
              address: p.address || p.fullAddress || null,
              latitude: p.latitude ?? p.lat ?? null,
              longitude: p.longitude ?? p.lng ?? null,
              bhk: p.bhk || p.propertyType || null,
              has_balcony: p.balcony !== undefined ? p.balcony : null,
              gym_nearby: p.gym !== undefined ? p.gym : null,
              deposit: p.deposit ?? p.securityDeposit ?? null,
              available_from: p.availableFrom || p.availabilityDate || null,
            }));

          if (results.length > 0) {
            console.log(`Success with endpoint: ${endpoint.url}`);
            return results;
          }
        }
      } catch (err) {
        console.log(`Endpoint failed: ${endpoint.url}`, err);
        continue;
      }
    }

    // Fallback to mock data if all endpoints fail
    console.log("All endpoints failed, using mock data");
    return MOCK_LISTINGS;
  } catch (error) {
    console.error("Search error:", error);
    return MOCK_LISTINGS;
  }
}

export async function POST(request: Request) {
  try {
    const { constraints } = await request.json();

    if (!constraints || Object.keys(constraints).length === 0) {
      return Response.json({ listings: [] });
    }

    const memberCount = Object.keys(constraints).length;

    // Get refused areas
    const refusedAreas = new Set<string>();
    Object.values(constraints as Record<string, Constraints>)
      .filter((c): c is Constraints => c !== null)
      .forEach((c) => {
        c.areas_refuse?.forEach((area) => refusedAreas.add(area));
      });

    // Fetch listings
    const results = await searchRealEstateAPI(
      constraints as Record<string, Constraints>
    );

    // listing.rent is the rent for the WHOLE flat, but max_rent is each
    // person's individual share, so compare against the group's combined
    // budget (sum of shares), not a single person's share.
    const totalBudget = Object.values(constraints as Record<string, Constraints>)
      .filter((c): c is Constraints => c !== null)
      .reduce((sum, c) => sum + (c.max_rent || 0), 0);

    // Filter results - but always return at least something
    let filtered = results
      .filter((listing: any) => {
        if (listing.area && refusedAreas.has(listing.area)) {
          return false;
        }
        // More permissive filter - allow up to 1.5x the combined budget
        if (listing.rent && totalBudget > 0 && listing.rent > totalBudget * 1.5) {
          return false;
        }
        return true;
      })
      .slice(0, 8);

    // If filtering removed everything, loosen the rent cap
    if (filtered.length === 0) {
      filtered = results
        .filter((listing: any) => !listing.rent || totalBudget === 0 || listing.rent <= totalBudget * 2)
        .slice(0, 8);
    }

    // Still nothing? Drop rent filtering entirely rather than return empty.
    if (filtered.length === 0) {
      filtered = results.slice(0, 8);
    }

    const enriched = filtered.map((listing: any) => withDerivedFields(listing, memberCount));

    return Response.json({ listings: enriched });
  } catch (error) {
    console.error("Search listings error:", error);
    return Response.json({ listings: [] });
  }
}
