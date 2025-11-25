import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../app/page'
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock dependencies
jest.mock('react-map-gl', () => ({
    __esModule: true,
    default: () => <div data-testid="mapbox-map" />,
    Map: () => <div data-testid="mapbox-map" />,
}));

jest.mock('mapbox-gl', () => ({
    Map: jest.fn(() => ({
        remove: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        addSource: jest.fn(),
        addLayer: jest.fn(),
        getSource: jest.fn(() => ({ setData: jest.fn() })),
        fitBounds: jest.fn(),
        setStyle: jest.fn(),
        setProjection: jest.fn(),
        once: jest.fn(),
        flyTo: jest.fn(),
    })),
    Marker: jest.fn(() => ({
        setLngLat: jest.fn().mockReturnThis(),
        addTo: jest.fn().mockReturnThis(),
        remove: jest.fn(),
    })),
    LngLatBounds: jest.fn(() => ({
        extend: jest.fn().mockReturnThis(),
    })),
    accessToken: '',
}));

describe('Trip Planning Integration', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'mock-token';
        (global.fetch as jest.Mock).mockClear();
    });

    it('initiates search and displays results', async () => {
        // Mock API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                start: { name: 'Paris', coordinates: [2.35, 48.85] },
                end: { name: 'Nice', coordinates: [7.26, 43.71] },
                waypoints: [
                    { name: 'Lyon', type: 'food', description: 'Great food', reason: 'Vibe', coordinates: [4.83, 45.76] }
                ],
                route: { type: 'LineString', coordinates: [[2.35, 48.85], [4.83, 45.76], [7.26, 43.71]] }
            })
        });

        render(
            <LanguageProvider>
                <Home />
            </LanguageProvider>
        );

        const startInput = screen.getByPlaceholderText('Where are you?');
        const endInput = screen.getByPlaceholderText('Where to?');
        const plusButton = screen.getByText('+');
        const launchButton = screen.getByText('Launch');

        fireEvent.change(startInput, { target: { value: 'Paris' } });
        fireEvent.change(endInput, { target: { value: 'Nice' } });
        // Click + button twice to set days to 3 (default is 1)
        fireEvent.click(plusButton);
        fireEvent.click(plusButton);
        fireEvent.click(launchButton);

        // Check loading state
        expect(screen.getByText(/Scanning local blogs/i)).toBeInTheDocument();

        // Wait for results
        await waitFor(() => {
            expect(screen.queryByText(/Scanning local blogs/i)).not.toBeInTheDocument();
        });

        const mapboxgl = require('mapbox-gl');
        expect(mapboxgl.Marker).toHaveBeenCalled();
    });
});
