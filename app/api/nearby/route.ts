import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchNearbyPlace } from '@/lib/mapbox';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function POST(request: Request) {
    try {
        const { location, coordinates, language } = await request.json();

        if (!location && !coordinates) {
            return NextResponse.json({ error: 'Missing location or coordinates' }, { status: 400 });
        }

        const isChineseMode = language === 'zh';
        const languageInstruction = isChineseMode 
            ? `请用中文回答。所有名称、描述、原因都必须使用简体中文。`
            : `Please respond in English. All names, descriptions, and reasons should be in English.`;

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash' // 使用 Gemini 2.5 Flash
        });

        const prompt = `
      ${languageInstruction}
      
      Find 3-5 REAL, WELL-KNOWN places near "${location}".
      Main location coordinates: [${coordinates[0]}, ${coordinates[1]}]
      
      CRITICAL REQUIREMENTS:
      1. These must be REAL places that actually exist and can be found on Google Maps or Mapbox
      2. Use the EXACT official name as it appears on maps (e.g., "Kushida Shrine", "Ichiran Ramen Hakata", "Canal City Hakata")
      3. All places must be within 3km of the main location
      4. Provide diverse types (at least one food, one sight)
      5. DO NOT make up places - only suggest well-known, established locations
      
      Focus on:
      - Popular restaurants and cafes with actual names (rating 4.3+)
      - Famous attractions and viewpoints
      - Unique local experiences
      - Shopping areas
      
      For each place, provide ONLY:
      - name: EXACT official place name ONLY ${isChineseMode ? '(只需要名称，不要地址)' : '(name only, no address)'} - Examples: "Kushida Shrine", "Canal City", "Ichiran Ramen"
      - type: MUST be EXACTLY one of: "food", "sight", "shop", or "activity" (lowercase only)
      - description: Brief 1-sentence description ${isChineseMode ? '(中文描述)' : ''}
      - rating: Realistic rating between 4.0 and 5.0 (e.g. 4.6)
      - review_count: Number of reviews (100-5000)
      - image_keyword: Visual search keyword for image (keep in English for better image results)
      
      DO NOT include coordinates or full addresses - we will search for these places on the map using their names.
      
      IMPORTANT: Ensure the "type" field is EXACTLY "food", "sight", "shop", or "activity" (lowercase). 
      - For restaurants/cafes/ramen shops, use "food"
      - For museums/temples/viewpoints/parks, use "sight"
      - For shopping centers/stores, use "shop"
      - For experiences/activities, use "activity"
      
      Return ONLY valid JSON:
      {
        "nearby_places": [
          { "name": "Place Name Only", "type": "food", "description": "...", "rating": 4.5, "review_count": 1200, "image_keyword": "..." }
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Raw Gemini nearby response:', text);

        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Remove any trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Remove comments if any
        jsonStr = jsonStr.replace(/\/\/.*/g, '');
        jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
        
        let nearbyData;
        try {
            nearbyData = JSON.parse(jsonStr);
            console.log('Successfully parsed nearby data:', nearbyData);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Cleaned JSON string:', jsonStr);
            console.error('Original text:', text);
            throw new Error('Failed to parse AI response for nearby places.');
        }
        
        // Validate response structure
        if (!nearbyData.nearby_places || !Array.isArray(nearbyData.nearby_places)) {
            console.error('Invalid nearby response structure:', nearbyData);
            throw new Error('Invalid AI nearby response format');
        }

        // Search for places using Mapbox with proximity to main location
        const placesWithCoords = await Promise.all(
            nearbyData.nearby_places.map(async (place: any, index: number) => {
                console.log(`🔍 Searching for: "${place.name}" near [${coordinates[0]}, ${coordinates[1]}]`);
                
                // Use Mapbox to search for this place name near the main coordinates
                const result = await searchNearbyPlace(place.name, coordinates, 5); // Search within 5km
                
                if (result) {
                    console.log(`  ✅ Found at: [${result.coordinates[0].toFixed(6)}, ${result.coordinates[1].toFixed(6)}] (${result.distance.toFixed(2)}km away)`);
                    console.log(`  📍 Full name: ${result.fullName}`);
                    
                    // Update the distance field with actual distance
                    return { 
                        ...place, 
                        coordinates: result.coordinates,
                        mapbox_name: result.fullName,
                        distance: parseFloat(result.distance.toFixed(1))
                    };
                } else {
                    // Fallback: If search fails, use main location with small offset
                    console.log(`  ⚠️  Search failed for "${place.name}", using offset from main location`);
                    const angle = (index * 2 * Math.PI) / nearbyData.nearby_places.length;
                    const offsetDist = 0.5 + (index * 0.3); // Varying distances: 0.5km, 0.8km, 1.1km, etc.
                    const offsetLng = (offsetDist / 111) * Math.cos(angle) / Math.cos(coordinates[1] * Math.PI / 180);
                    const offsetLat = (offsetDist / 111) * Math.sin(angle);
                    const offsetCoords: [number, number] = [
                        coordinates[0] + offsetLng,
                        coordinates[1] + offsetLat
                    ];
                    console.log(`  -> Using offset coordinates: [${offsetCoords[0].toFixed(6)}, ${offsetCoords[1].toFixed(6)}] (~${offsetDist.toFixed(1)}km away)`);
                    return { ...place, coordinates: offsetCoords, distance: offsetDist };
                }
            })
        );

        // Filter out places without coordinates and validate distance
        const validPlaces = placesWithCoords.filter((p: any) => {
            if (!p.coordinates) {
                console.log(`Filtered out ${p.name}: no coordinates`);
                return false;
            }
            
            // Recalculate distance to verify
            if (coordinates) {
                const [lon1, lat1] = coordinates;
                const [lon2, lat2] = p.coordinates;
                const distance = calculateDistance(lat1, lon1, lat2, lon2);
                
                // More lenient filter: allow places up to 5km away (since we're using offset fallback)
                if (distance > 5) {
                    console.log(`Filtered out ${p.name}: ${distance.toFixed(2)}km away (>5km limit)`);
                    return false;
                }
                
                // Update the distance field with actual calculated distance
                p.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
            }
            
            return true;
        });
        
        console.log(`\n✅ Kept ${validPlaces.length}/${placesWithCoords.length} nearby places after filtering`);

        return NextResponse.json({
            nearby_places: validPlaces
        });

    } catch (error) {
        console.error("Nearby places error:", error);
        return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
    }
}

