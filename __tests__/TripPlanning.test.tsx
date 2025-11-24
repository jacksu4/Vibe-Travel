import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import Home from '../app/page'

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

        render(<Home />);

        const startInput = screen.getByPlaceholderText('Where are you?');
        const endInput = screen.getByPlaceholderText('Where to?');
        // Days input has default value 1, but it's type number.
        // We can find it by type or value.
        const daysInput = screen.getByDisplayValue('1');
        const launchButton = screen.getByText('Launch');

        fireEvent.change(startInput, { target: { value: 'Paris' } });
        fireEvent.change(endInput, { target: { value: 'Nice' } });
        fireEvent.change(daysInput, { target: { value: '3' } });
        fireEvent.click(launchButton);

        // Check loading state
        expect(screen.getByText(/Scanning local blogs/i)).toBeInTheDocument();

        // Wait for results
        await waitFor(() => {
            expect(screen.queryByText(/Scanning local blogs/i)).not.toBeInTheDocument();
        });

        // Verify map received data (indirectly via props or side effects if we could inspect them, 
        // but here we trust the integration. In a real e2e test we'd check the map).
        // Since we mocked mapbox-gl, we can check if Marker was instantiated.
        const mapboxgl = require('mapbox-gl');
        expect(mapboxgl.Marker).toHaveBeenCalled();
    });
});
