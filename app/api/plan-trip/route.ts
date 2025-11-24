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
      The user wants a "Vibe" score of ${vibe}/100 (0=Efficiency, 100=Serendipity).
      
      CRITICAL GEOGRAPHIC RULES:
      1. ALL waypoints MUST be located between the start and end points
      2. Waypoints should follow a logical geographic progression from start to end
      3. DO NOT suggest places that require significant backtracking or detours in the wrong direction
      4. For example: If traveling from Kagoshima to Fukuoka (both in Kyushu), ALL stops must be in Kyushu or along the direct route
      5. NEVER suggest places that are hundreds of kilometers away from the direct route
      
      STRICT VIBE LOGIC:
      - If Vibe < 30 (Efficiency): Suggest ONLY practical stops (gas, quick food, rest areas) directly on the highway. Max 1-2 stops.
      - If Vibe 30-70 (Balanced): Suggest famous landmarks or highly-rated restaurants near the route.
      - If Vibe > 70 (Serendipity): Suggest "Hidden Gems" (unique local spots, scenic viewpoints, quirky shops) that might require a small detour (max 30km from direct route).
      
      Suggest a logical driving route with stops ordered geographically from start to end.

      For each stop, provide:
      - name: Name of the place ${isChineseMode ? '(中文名称)' : ''}
      - type: MUST be EXACTLY one of: "food", "sight", "shop", or "activity" (lowercase only)
      - description: Short, witty description (1 sentence) ${isChineseMode ? '(中文描述)' : ''}
      - reason: Why this fits the vibe ${isChineseMode ? '(中文说明)' : ''}
      - rating: A float between 4.0 and 5.0 (e.g. 4.8)
      - location: A specific address or city name to geocode
      - image_keyword: A specific, visual keyword phrase for image search (keep in English for better image results)

      Also provide 3-5 "extra_suggestions" that are interesting places NEAR the route but not necessarily stops. These should be "Hidden Gems" that the user might see on the map and decide to visit.
      
      IMPORTANT: Ensure the "type" field is EXACTLY "food", "sight", "shop", or "activity" (lowercase). For restaurants/cafes, use "food". For viewpoints/museums/temples, use "sight".
      
      Return ONLY valid JSON in this format:
      {
        "waypoints": [
          { "name": "...", "type": "food", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "extra_suggestions": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ]
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
            route: routeGeoJSON
        });

    } catch (error) {
        console.error("Trip planning error:", error);
        return NextResponse.json({ error: 'Failed to plan trip' }, { status: 500 });
    }
}
