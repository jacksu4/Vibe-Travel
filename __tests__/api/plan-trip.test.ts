
import { POST } from '@/app/api/plan-trip/route';
import { POST } from '@/app/api/plan-trip/route';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, options) => ({
            ...data,
            status: options?.status || 200,
            json: async () => data,
        })),
    },
}));

// Mock external dependencies
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn((params) => {
            if (params.model === 'gemini-2.5-flash') {
                return {
                    generateContent: jest.fn().mockResolvedValue({
                        response: {
                            text: jest.fn().mockReturnValue(JSON.stringify({
                                waypoints: [{ name: 'Stop 1', location: 'Loc 1', type: 'sight' }],
                                start_location_suggestions: [],
                                end_location_suggestions: [],
                                extra_suggestions: [],
                                route_waypoints: [],
                                story_itinerary: '# Itinerary'
                            }))
                        }
                    })
                };
            }
            // Fallback or throw an error if a different model is requested
            throw new Error(`Unexpected model requested: ${JSON.stringify(params)}`);
        })
    }))
}));

jest.mock('@/lib/mapbox', () => ({
    getCoordinates: jest.fn().mockResolvedValue([10, 20]),
    getRoute: jest.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] })
}));

jest.mock('@/lib/cache', () => ({
    tripPlanCache: {
        has: jest.fn().mockReturnValue(false),
        get: jest.fn(),
        set: jest.fn()
    }
}));

describe('Trip Planning API', () => {
    it('should return 400 if waypoints are missing', async () => {
        const req = new Request('http://localhost:3000/api/plan-trip', {
            method: 'POST',
            body: JSON.stringify({ waypoints: [] })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should plan a trip successfully', async () => {
        const req = new Request('http://localhost:3000/api/plan-trip', {
            method: 'POST',
            body: JSON.stringify({
                waypoints: ['Paris', 'Nice'],
                vibe: 50,
                days: 3
            })
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.waypoints).toHaveLength(1);
        expect(data.itinerary).toBe('# Itinerary');
    });
});
