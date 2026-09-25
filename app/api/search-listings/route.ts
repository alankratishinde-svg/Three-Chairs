import { Constraints } from '@/lib/types';

// Mock listings for testing (fallback when RapidAPI fails)
// Budget-friendly options for Riya, Meera, Kavita (₹15000 per person)
const MOCK_LISTINGS = [
  {
    name: "Cozy 2BHK, Shivajinagar",
    rent: 45000, // ₹15k per person
    area: "Shivajinagar",
    floor: 2,
    has_lift: true,
    parking: true,
    bathrooms: 2,
    pet_friendly: false,
    furnishing: "semi-furnished",
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
  },
];

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

    // Calculate average rent for filtering
    const avgRent = Object.values(constraints as Record<string, Constraints>)
      .filter((c): c is Constraints => c !== null)
      .reduce((sum, c) => sum + (c.max_rent || 0), 0) /
      Object.keys(constraints).length;

    // Filter results - but always return at least something
    let filtered = results
      .filter((listing: any) => {
        if (listing.area && refusedAreas.has(listing.area)) {
          return false;
        }
        // More permissive filter - allow up to 1.5x the average budget
        if (listing.rent && listing.rent > avgRent * 1.5) {
          return false;
        }
        return true;
      })
      .slice(0, 8);

    // If filtering removed everything, return unfiltered results (for demo)
    if (filtered.length === 0) {
      filtered = results
        .filter((listing: any) => !listing.rent || listing.rent <= avgRent * 2)
        .slice(0, 8);
    }

    return Response.json({ listings: filtered });
  } catch (error) {
    console.error("Search listings error:", error);
    return Response.json({ listings: [] });
  }
}
