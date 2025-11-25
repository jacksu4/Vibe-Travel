import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCoordinates, getRoute } from '@/lib/mapbox';

// Initialize Google Gemini AI client with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Import in-memory cache for trip plans
import { tripPlanCache } from '@/lib/cache';

/**
 * POST /api/plan-trip
 * 
 * Main API endpoint for planning multi-waypoint trips using AI.
 * 
 * @param request - Request body containing:
 *   - waypoints: string[] - Array of location names (minimum 2)
 *   - vibe: number - Serendipity level 0-100 (0=efficient, 100=adventurous)  
 *   - days: number - Trip duration in days
 *   - customPreferences: string - Optional user preferences
 *   - language: 'en' | 'zh' - Interface language
 * 
 * @returns JSON response with:
 *   - start: { name, coordinates } - Start location details
 *   - end: { name, coordinates } - End location details
 *   - userWaypoints: { name, coordinates }[] - Intermediate stops
 *   - waypoints: { name, type, description, coordinates }[] - AI-suggested POIs
 *   - extraSuggestions: Combined array of city highlights and route stops
 *   - route: GeoJSON LineString for the driving route
 *   - itinerary: Markdown-formatted travel story
 * 
 * Key features:
 * - Server-side and client-side caching for performance
 * - Parallelized geocoding for speed
 * - Robust JSON parsing with Markdown handling
 * - Cheapest insertion algorithm for optimal route ordering
 */

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { waypoints, vibe, days, customPreferences, language } = body;

        // Input validation
        if (!waypoints || waypoints.length < 2) {
            return NextResponse.json({ error: 'At least 2 waypoints required' }, { status: 400 });
        }

        // CACHING: Check if we've already processed this exact trip request
        // Create a deterministic key based on all input parameters
        const cacheKey = JSON.stringify({ waypoints, vibe, days, customPreferences, language });

        if (tripPlanCache.has(cacheKey)) {
            console.log(`⚡️ Cache hit for trip plan: ${waypoints.join(' -> ')}`);
            return NextResponse.json(tripPlanCache.get(cacheKey));
        }

        // Convert user's "vibe" slider (0-100) to AI's serendipity level (0-10)
        // Lower = more efficient/direct, Higher = more adventurous/exploratory
        const serendipityLevel = Math.round(vibe / 10);
        console.log(`\n🎯 Planning multi-waypoint trip with serendipity level: ${serendipityLevel}/10 (vibe: ${vibe}/100)`);
        console.log(`📍 Waypoints: ${waypoints.join(' → ')}`);
        if (customPreferences) {
            console.log(`💬 Custom preferences: ${customPreferences}`);
        }

        const isChineseMode = language === 'zh';

        // STEP 1: Geocode all user-specified waypoints in parallel for performance
        // Convert location names to [longitude, latitude] coordinates
        const waypointCoords = await Promise.all(
            waypoints.map(async (wp: string) => {
                const coords = await getCoordinates(wp, undefined, language);
                return { name: wp, coordinates: coords };
            })
        );

        // Validate that all waypoints were successfully geocoded
        const failedWaypoints = waypointCoords.filter(wp => !wp.coordinates);
        if (failedWaypoints.length > 0) {
            return NextResponse.json({
                error: `Could not find coordinates for: ${failedWaypoints.map(w => w.name).join(', ')}`
            }, { status: 400 });
        }

        const startCoords = waypointCoords[0].coordinates!;
        const endCoords = waypointCoords[waypointCoords.length - 1].coordinates!;

        // 2. Ask Gemini for POI Waypoints
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash'
        });

        const languageInstruction = isChineseMode
            ? `请务必全程使用简体中文回答。所有地名、景点名称、描述、原因、行程故事都必须使用中文。如果地名有官方中文译名，请使用中文译名（例如：使用"清水寺"而不是"Kiyomizu-dera"）。`
            : `Please respond in English. All names, descriptions, and reasons should be in English.`;

        const customPreferencesSection = customPreferences
            ? `\n🎯 CUSTOM USER PREFERENCES:\n${customPreferences}\n\nIMPORTANT: Prioritize these preferences when selecting waypoints and crafting the itinerary.\n`
            : '';

        const prompt = `
      ${languageInstruction}
      
      Plan a ${days || 1}-day road trip through the following locations:
      ${waypoints.map((wp: string, i: number) => `${i + 1}. ${wp}`).join('\n')}
      
      Start coordinates: [${startCoords[0]}, ${startCoords[1]}]
      End coordinates: [${endCoords[0]}, ${endCoords[1]}]
      ${waypointCoords.slice(1, -1).length > 0 ? `\nIntermediate stops:\n${waypointCoords.slice(1, -1).map((wp, i) => `${i + 1}. ${wp.name}: [${wp.coordinates![0]}, ${wp.coordinates![1]}]`).join('\n')}` : ''}
      ${customPreferencesSection}
      
      🎯 SERENDIPITY LEVEL: ${serendipityLevel}/10
      (0 = Maximum Efficiency, 10 = Maximum Serendipity)
      
      CRITICAL GEOGRAPHIC RULES:
      1. ALL suggested POI waypoints MUST be located between or near the user's specified route
      2. Waypoints should follow the logical geographic progression through the user's stops
      3. DO NOT suggest places that require significant backtracking

      WAYPOINT GENERATION RULES BASED ON SERENDIPITY LEVEL:
      
      📍 Level 0-2 (Efficiency Focus):
      - Suggest 0-1 POI stops maximum
      - ONLY practical stops: gas stations, rest areas, fast food
      - All stops must be directly on the route
      
      📍 Level 3-4 (Slight Exploration):
      - Suggest 1-2 POI stops
      - Famous landmarks or popular restaurants within 5km of route
      
      📍 Level 5-6 (Balanced):
      - Suggest 2-3 POI stops
      - Mix of popular attractions and local favorites
      - Small detours (up to 15km) acceptable
      
      📍 Level 7-8 (Adventure):
      - Suggest 3-4 POI stops
      - Include "hidden gems" and local secrets
      - Detours up to 25km acceptable
      
      📍 Level 9-10 (Maximum Serendipity):
      - Suggest 4-5 POI stops
      - Prioritize unique, off-the-beaten-path experiences
      - Detours up to 30km for exceptional places
      - Generate 5+ "extra_suggestions" for spontaneous exploration

      For each POI stop, provide:
      - name: Name of the place ${isChineseMode ? '(中文名称)' : ''}
      - type: EXACTLY one of: "food", "sight", "shop", or "activity" (lowercase only)
      - description: Short description (1 sentence) ${isChineseMode ? '(中文描述)' : ''}
      - reason: Why this fits serendipity level ${serendipityLevel} ${isChineseMode ? '(中文说明)' : ''}
      - rating: A float between 4.0 and 5.0 (e.g. 4.8)
      - location: A specific address or city name
      - image_keyword: Visual keyword phrase for image search (keep in English)

      Also provide:
      Also provide:
      1. 6-8 "start_location_suggestions": Must-visit places in the START city (${waypoints[0]}). Focus on dense city center attractions.
      2. 6-8 "end_location_suggestions": Must-visit places in the END city (${waypoints[waypoints.length - 1]}). Focus on dense city center attractions.
      3. 5-8 "extra_suggestions": Interesting places NEAR the route (but not on it).
      4. 3-5 "route_waypoints": Specific, interesting stops DIRECTLY ON the driving route between waypoints.
      
      Finally, generate a "story_itinerary" in Markdown format:
      - Warm, engaging, travel-blogger style narrative
      - Organize by day (Day 1, Day 2, etc.)
      - Mention the user's specified stops AND your suggested POI stops
      - Add pro tips and vibe checks
      - Use Markdown formatting
      - **IMPORTANT**: When describing the start and end cities, mention the specific places from your suggestions list.

      Return ONLY valid JSON in this format:
      {
        "waypoints": [
          { "name": "...", "type": "food", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "start_location_suggestions": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "end_location_suggestions": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "extra_suggestions": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "route_waypoints": [
          { "name": "...", "type": "sight", "description": "...", "reason": "...", "rating": 4.5, "location": "...", "image_keyword": "..." }
        ],
        "story_itinerary": "# Your Trip...\\n\\n## Day 1\\n..."
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Raw Gemini response:', text);

        // Robust JSON extraction
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            console.error('❌ No JSON object found in response');
            throw new Error('AI response did not contain valid JSON');
        }

        let jsonStr = text.substring(startIndex, endIndex + 1);

        // Clean up JSON
        // Remove Markdown code blocks if present (start and end)
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        // Remove trailing commas (simple regex, covers most cases)
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        let tripData;
        try {
            tripData = JSON.parse(jsonStr);
            console.log('Successfully parsed trip data');
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Failed JSON string:', jsonStr);

            // Attempt to repair common JSON errors
            try {
                // Remove control characters
                const cleanStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
                tripData = JSON.parse(cleanStr);
                console.log('Successfully parsed trip data after cleanup');
            } catch (retryError) {
                throw new Error('Failed to parse AI response. Please try again.');
            }
        }

        if (!tripData.waypoints || !Array.isArray(tripData.waypoints)) {
            console.error('Invalid response structure:', tripData);
            throw new Error('Invalid AI response format');
        }

        // 3. Geocode POI Waypoints
        const waypointsWithCoords = await Promise.all(tripData.waypoints.map(async (wp: any) => {
            const coords = await getCoordinates(wp.location, undefined, language);
            return { ...wp, coordinates: coords };
        }));

        // 3.1 Geocode Extra Suggestions
        const extraSuggestionsWithCoords = tripData.extra_suggestions
            ? await Promise.all(tripData.extra_suggestions.map(async (wp: any) => {
                const coords = await getCoordinates(wp.location, undefined, language);
                return { ...wp, coordinates: coords };
            }))
            : [];

        // 3.2 Geocode Start City Suggestions
        const startSuggestionsWithCoords = tripData.start_location_suggestions
            ? await Promise.all(tripData.start_location_suggestions.map(async (wp: any) => {
                // Use start coords as proximity hint
                const coords = await getCoordinates(wp.name, startCoords, language);
                return { ...wp, coordinates: coords };
            }))
            : [];

        // 3.3 Geocode End City Suggestions
        const endSuggestionsWithCoords = tripData.end_location_suggestions
            ? await Promise.all(tripData.end_location_suggestions.map(async (wp: any) => {
                // Use end coords as proximity hint
                const coords = await getCoordinates(wp.name, endCoords, language);
                return { ...wp, coordinates: coords };
            }))
            : [];

        // 3.4 Geocode Route Waypoints
        const routeWaypointsWithCoords = tripData.route_waypoints
            ? await Promise.all(tripData.route_waypoints.map(async (wp: any) => {
                const coords = await getCoordinates(wp.location, undefined, language);
                return { ...wp, coordinates: coords };
            }))
            : [];

        // Combine all extra suggestions for the map
        const allExtraSuggestions = [
            ...extraSuggestionsWithCoords,
            ...startSuggestionsWithCoords,
            ...endSuggestionsWithCoords,
            ...routeWaypointsWithCoords
        ].filter((wp: any) => wp.coordinates);

        // 4. Get Route through all user waypoints + POI waypoints
        // We need to insert POI waypoints into the correct order between user waypoints
        // using a "cheapest insertion" heuristic to minimize total distance.

        // Helper to calculate Haversine distance in km
        const getDistance = (coord1: [number, number], coord2: [number, number]) => {
            const R = 6371; // Radius of the earth in km
            const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
            const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Start with user's fixed waypoints
        let orderedRoutePoints = [...waypointCoords];

        // Insert each AI waypoint into the best position
        for (const aiWp of waypointsWithCoords) {
            if (!aiWp.coordinates) continue;

            let bestInsertIndex = 1;
            let minAddedDist = Infinity;

            // Try inserting between every pair of existing points
            for (let i = 1; i < orderedRoutePoints.length; i++) {
                const p1 = orderedRoutePoints[i - 1].coordinates!;
                const p2 = orderedRoutePoints[i].coordinates!;
                const pNew = aiWp.coordinates;

                const currentDist = getDistance(p1, p2);
                const newDist = getDistance(p1, pNew) + getDistance(pNew, p2);
                const addedDist = newDist - currentDist;

                if (addedDist < minAddedDist) {
                    minAddedDist = addedDist;
                    bestInsertIndex = i;
                }
            }

            // Insert at the best position found
            orderedRoutePoints.splice(bestInsertIndex, 0, aiWp);
        }

        const allRoutePoints = orderedRoutePoints.map(wp => wp.coordinates as [number, number]);

        const routeGeoJSON = await getRoute(allRoutePoints);

        const responseData = {
            start: { name: waypoints[0], coordinates: startCoords },
            end: { name: waypoints[waypoints.length - 1], coordinates: endCoords },
            userWaypoints: waypointCoords.slice(1, -1), // Intermediate user stops
            waypoints: waypointsWithCoords.filter((wp: any) => wp.coordinates), // POI waypoints
            extraSuggestions: allExtraSuggestions, // Combined extra suggestions
            route: routeGeoJSON,
            itinerary: tripData.story_itinerary
        };

        // Store in cache
        tripPlanCache.set(cacheKey, responseData);

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("❌ Trip planning error details:", error);
        console.error("Stack:", error.stack);
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY is missing in environment variables!");
        }
        return NextResponse.json({
            error: `Failed to plan trip: ${error.message}`,
            details: error.stack
        }, { status: 500 });
    }
}
