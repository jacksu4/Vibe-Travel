const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface PlacePhoto {
  url: string;
  width: number;
  height: number;
  attributions: string[];
}

export interface PlacePhotosResult {
  photos: PlacePhoto[];
  placeName: string;
}

/**
 * Fetch real photos from Google Places API for a specific place
 * @param placeName - Name of the place to search for
 * @param coordinates - [longitude, latitude] to bias the search
 * @returns Array of photo URLs (max 5) or null if not found
 */
export async function getPlacePhotos(
  placeName: string,
  coordinates: [number, number]
): Promise<PlacePhotosResult | null> {
  if (!PLACES_API_KEY) {
    console.warn('⚠️  Google Places API key not configured');
    return null;
  }

  try {
    console.log(`📸 Fetching photos for: "${placeName}" near [${coordinates[0]}, ${coordinates[1]}]`);

    // 1. Search for the place using Text Search (New)
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos'
      },
      body: JSON.stringify({
        textQuery: placeName,
        locationBias: {
          circle: {
            center: {
              latitude: coordinates[1],
              longitude: coordinates[0]
            },
            radius: 5000 // Search within 5km
          }
        },
        maxResultCount: 1
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ Places API error (${searchResponse.status}):`, errorText);
      return null;
    }

    const searchData = await searchResponse.json();

    if (!searchData.places || searchData.places.length === 0) {
      console.log(`   No place found in Google Places for: "${placeName}"`);
      return null;
    }

    const place = searchData.places[0];
    console.log(`   ✓ Found: ${place.displayName?.text || placeName}`);

    // 2. Extract photos (max 5)
    if (!place.photos || place.photos.length === 0) {
      console.log(`   No photos available for this place`);
      return {
        photos: [],
        placeName: place.displayName?.text || placeName
      };
    }

    // Limit to 5 photos
    const photoLimit = Math.min(place.photos.length, 5);
    const photos: PlacePhoto[] = [];

    for (let i = 0; i < photoLimit; i++) {
      const photo = place.photos[i];
      
      // Construct photo URL with proper dimensions
      const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?key=${PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=600`;

      photos.push({
        url: photoUrl,
        width: photo.widthPx || 600,
        height: photo.heightPx || 400,
        attributions: photo.authorAttributions?.map((a: any) => a.displayName) || []
      });
    }

    console.log(`   ✅ Loaded ${photos.length} photo(s)`);

    return {
      photos,
      placeName: place.displayName?.text || placeName
    };

  } catch (error) {
    console.error('❌ Error fetching place photos:', error);
    return null;
  }
}

