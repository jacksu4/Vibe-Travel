const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function getCoordinates(place: string, proximity?: [number, number]): Promise<[number, number] | null> {
    if (!MAPBOX_TOKEN) return null;

    try {
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
        
        // Add proximity bias to search near a specific location
        if (proximity) {
            url += `&proximity=${proximity[0]},${proximity[1]}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].center; // [lng, lat]
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

// Get city/country context from coordinates
async function getLocationContext(coordinates: [number, number]): Promise<string> {
    if (!MAPBOX_TOKEN) return '';
    
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${MAPBOX_TOKEN}&types=place,region,country`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Extract place names from context
            const contexts: string[] = [];
            for (const feature of data.features) {
                if (feature.place_type.includes('place') || feature.place_type.includes('region') || feature.place_type.includes('country')) {
                    contexts.push(feature.text);
                }
            }
            return contexts.join(', ');
        }
    } catch (error) {
        console.error("Location context error:", error);
    }
    return '';
}

// Search for places near a specific location with more details
export async function searchNearbyPlace(
    placeName: string, 
    nearCoordinates: [number, number],
    searchRadius: number = 5 // km
): Promise<{ coordinates: [number, number], fullName: string, distance: number } | null> {
    if (!MAPBOX_TOKEN) return null;

    try {
        // Get location context (city, country) to improve search accuracy
        const locationContext = await getLocationContext(nearCoordinates);
        const searchQuery = locationContext ? `${placeName}, ${locationContext}` : placeName;
        
        console.log(`      Search query: "${searchQuery}"`);
        
        // Use types to focus on POIs (points of interest)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&proximity=${nearCoordinates[0]},${nearCoordinates[1]}&limit=10&types=poi,address`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Helper to calculate distance
            const calcDist = (coord: [number, number]) => {
                const R = 6371;
                const dLat = (coord[1] - nearCoordinates[1]) * Math.PI / 180;
                const dLon = (coord[0] - nearCoordinates[0]) * Math.PI / 180;
                const a = 
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(nearCoordinates[1] * Math.PI / 180) * Math.cos(coord[1] * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };
            
            // Find the closest result within radius
            for (const feature of data.features) {
                const distance = calcDist(feature.center);
                if (distance <= searchRadius) {
                    return {
                        coordinates: feature.center,
                        fullName: feature.place_name || placeName,
                        distance: distance
                    };
                }
            }
            
            // If no results within radius, return null (don't use far-away results)
            console.log(`      No results found within ${searchRadius}km radius`);
            return null;
        }
    } catch (error) {
        console.error("Nearby place search error:", error);
    }
    return null;
}

export async function getRoute(points: [number, number][]): Promise<any> {
    if (!MAPBOX_TOKEN || points.length < 2) return null;

    const coordinatesString = points.map(p => p.join(',')).join(';');

    try {
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry;
        }
    } catch (error) {
        console.error("Routing error:", error);
    }
    return null;
}
