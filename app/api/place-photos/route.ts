import { NextResponse } from 'next/server';
import { getPlacePhotos } from '@/lib/google-places';

export async function POST(request: Request) {
  try {
    const { name, coordinates } = await request.json();

    if (!name || !coordinates) {
      return NextResponse.json(
        { error: 'Missing name or coordinates' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log(`\n🖼️  Photo request for: ${name}`);

    const result = await getPlacePhotos(name, coordinates);

    const duration = Date.now() - startTime;

    if (result && result.photos.length > 0) {
      console.log(`✅ Returned ${result.photos.length} photo(s) in ${duration}ms\n`);
      return NextResponse.json({
        photos: result.photos.map(p => ({ url: p.url })),
        count: result.photos.length
      });
    } else {
      console.log(`⚠️  No photos found in ${duration}ms, using fallback\n`);
      // Return empty array to indicate no photos available
      return NextResponse.json({
        photos: [],
        count: 0
      });
    }

  } catch (error) {
    console.error('Place photos API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

