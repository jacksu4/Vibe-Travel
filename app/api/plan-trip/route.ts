import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCoordinates, getRoute } from '@/lib/mapbox';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const { start, end, vibe, days, language } = await request.json();

        if (!start || !end) {
            return NextResponse.json({ error: 'Missing start or end location' }, { status: 400 });
        }

        // Convert 0-100 vibe to 0-10 serendipity level
        const serendipityLevel = Math.round(vibe / 10);
        console.log(`\n🎯 Planning trip with serendipity level: ${serendipityLevel}/10 (vibe: ${vibe}/100)`);

        const isChineseMode = language === 'zh';

        // 1. Geocode Start and End
        const startCoords = await getCoordinates(start);
        const endCoords = await getCoordinates(end);

        if (!startCoords || !endCoords) {
            return NextResponse.json({ error: 'Could not find coordinates for locations' }, { status: 400 });
        }

        // 2. Ask Gemini for Waypoints - using Gemini 2.5 Flash
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash'
        });

        const languageInstruction = isChineseMode
            ? `请用中文回答。所有名称、描述、原因都必须使用简体中文。`
            : `Please respond in English. All names, descriptions, and reasons should be in English.`;

        const prompt = `
      ${languageInstruction}
      
      Plan a ${days || 1}-day road trip from "${start}" to "${end}".
      Start coordinates: [${startCoords[0]}, ${startCoords[1]}]
      End coordinates: [${endCoords[0]}, ${endCoords[1]}]
      
      🎯 SERENDIPITY LEVEL: ${serendipityLevel}/10
      (0 = Maximum Efficiency, 10 = Maximum Serendipity)
      
      CRITICAL GEOGRAPHIC RULES:
      1. ALL waypoints MUST be located between the start and end points
      2. Waypoints should follow a logical geographic progression from start to end
      3. DO NOT suggest places that require significant backtracking or detours in the wrong direction
      4. NEVER suggest places that are hundreds of kilometers away from the direct route
      
      WAYPOINT GENERATION RULES BASED ON SERENDIPITY LEVEL:
      
      📍 Level 0-2 (Efficiency Focus):
      - Suggest 0-1 stops maximum
      - ONLY practical stops: gas stations, highway rest areas, fast food chains
      - All stops must be directly on the main highway (no detours)
      - Prioritize speed and directness
      
      📍 Level 3-4 (Slight Exploration):
      - Suggest 1-2 stops
      - Famous landmarks or popular restaurants within 5km of the route
      - Quick photo opportunities at well-known spots
      - Minimal time added to journey
      
      📍 Level 5-6 (Balanced):
      - Suggest 2-3 stops
      - Mix of popular attractions and local favorites
      - Small detours (up to 15km) acceptable for highly-rated places
      - Balance between efficiency and experience
      
      📍 Level 7-8 (Adventure):
      - Suggest 3-4 stops
      - Include "hidden gems" and local secrets
      - Scenic viewpoints, quirky shops, local eateries
      - Detours up to 25km acceptable for unique experiences
      - Prioritize authenticity over convenience
      
      📍 Level 9-10 (Maximum Serendipity):
      - Suggest 4-5 stops
      - Prioritize unique, off-the-beaten-path experiences
      - Scenic routes over highways when possible
      - Detours up to 30km for exceptional places
      - Include unexpected discoveries and local culture
      - Generate 5+ "extra_suggestions" for spontaneous exploration
      
      For each stop, provide:
      - name: Name of the place ${isChineseMode ? '(中文名称)' : ''}
      - type: EXACTLY one of: "food", "sight", "shop", or "activity" (lowercase only)
      - description: Short, witty description (1 sentence) ${isChineseMode ? '(中文描述)' : ''}
      - reason: Why this fits serendipity level ${serendipityLevel} ${isChineseMode ? '(中文说明)' : ''}
      - rating: A float between 4.0 and 5.0 (e.g. 4.8)
      - location: A specific address or city name to geocode
      - image_keyword: A specific, visual keyword phrase for image search (keep in English for better image results)

      Also provide 3-5 "extra_suggestions" (or more for level 9-10) that are interesting places NEAR the route.
      
      IMPORTANT: Ensure the "type" field is EXACTLY "food", "sight", "shop", or "activity" (lowercase).

      Finally, generate a "story_itinerary" in Markdown format.
      - This should be a warm, engaging, travel-blogger style narrative of the trip.
      - Organize it day by day (Day 1, Day 2, etc.).
      - Mention the stops you selected and why they are great.
      - Add some "pro tips" or "vibe checks" for the journey.
      - Make it feel personal and exciting.
      - Use Markdown formatting (headers, bold, lists) to make it readable.
      
      Return ONLY valid JSON in this format:
      {
        "waypoints": [
          { "name": "...", "type": "food", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "extra_suggestions": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "story_itinerary": "# Your Trip to ...\n\n## Day 1\n..."
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Raw Gemini response:', text);

        // Clean up JSON if markdown code blocks are present
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Remove any trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        // Remove comments if any
        jsonStr = jsonStr.replace(/\/\/.*/g, '');
        jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

        let tripData;
        try {
            tripData = JSON.parse(jsonStr);
            console.log('Successfully parsed trip data:', tripData);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Cleaned JSON string:', jsonStr);
            console.error('Original text:', text);
            throw new Error('Failed to parse AI response. Please try again.');
        }

        // Validate response structure
        if (!tripData.waypoints || !Array.isArray(tripData.waypoints)) {
            console.error('Invalid response structure:', tripData);
            throw new Error('Invalid AI response format');
        }

        // 3. Geocode Waypoints
        const waypointsWithCoords = await Promise.all(tripData.waypoints.map(async (wp: any) => {
            const coords = await getCoordinates(wp.location);
            return { ...wp, coordinates: coords };
        }));

        // 3.1 Geocode Extra Suggestions
        const extraSuggestionsWithCoords = tripData.extra_suggestions
            ? await Promise.all(tripData.extra_suggestions.map(async (wp: any) => {
                const coords = await getCoordinates(wp.location);
                return { ...wp, coordinates: coords };
            }))
            : [];

        // 4. Get Route
        // Construct coordinates string: start;wp1;wp2;...;end
        const allPoints = [
            startCoords,
            ...waypointsWithCoords.map((wp: any) => wp.coordinates).filter((c: any) => c), // Filter out failed geocodes
            endCoords
        ];

        const routeGeoJSON = await getRoute(allPoints);

        return NextResponse.json({
            start: { name: start, coordinates: startCoords },
            end: { name: end, coordinates: endCoords },
            waypoints: waypointsWithCoords.filter((wp: any) => wp.coordinates),
            extraSuggestions: extraSuggestionsWithCoords.filter((wp: any) => wp.coordinates),
            route: routeGeoJSON,
            itinerary: tripData.story_itinerary
        });

    } catch (error: any) {
        console.error("❌ Trip planning error details:", error);
        console.error("Stack:", error.stack);
        // Check if API key is missing
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY is missing in environment variables!");
        }
        return NextResponse.json({
            error: `Failed to plan trip: ${error.message}`,
            details: error.stack
        }, { status: 500 });
    }
}
