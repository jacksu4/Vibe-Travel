import { NextResponse } from 'next/server';
import { getPlacePhotos } from '@/lib/google-places';

import { photoCache } from '@/lib/cache';

// ...

export async function POST(request: Request) {
  try {
    const { name, coordinates } = await request.json();

    if (!name || !coordinates) {
      return NextResponse.json(
        { error: 'Missing name or coordinates' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `photos:${name}:${coordinates.join(',')}`;
    if (photoCache.has(cacheKey)) {
      console.log(`⚡️ Cache hit for photos: ${name}`);
      const cachedData = photoCache.get(cacheKey);
      return NextResponse.json(cachedData);
    }

    const startTime = Date.now();
    console.log(`\n🖼️  Photo request for: ${name}`);

    const result = await getPlacePhotos(name, coordinates);

    const duration = Date.now() - startTime;

    if (result && result.photos.length > 0) {
      console.log(`✅ Returned ${result.photos.length} photo(s) in ${duration}ms\n`);
      const responseData = {
        photos: result.photos.map(p => ({ url: p.url })),
        count: result.photos.length
      };
      // Store in cache
      photoCache.set(cacheKey, responseData);
      return NextResponse.json(responseData);
    } else {
      console.log(`⚠️  No photos found in ${duration}ms, using fallback\n`);
      const emptyData = {
        photos: [],
        count: 0
      };
      // Cache empty results too to avoid repeated failed lookups
      photoCache.set(cacheKey, emptyData);
      return NextResponse.json(emptyData);
    }

  } catch (error) {
    console.error('Place photos API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

