import { render, screen } from '@testing-library/react'
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

import { LanguageProvider } from '../contexts/LanguageContext';

// ... (mocks remain same)

describe('Home Page', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'mock-token';
    });

    it('renders the map background', () => {
        render(
            <LanguageProvider>
                <Home />
            </LanguageProvider>
        )
        const mapboxgl = require('mapbox-gl');
        expect(mapboxgl.Map).toHaveBeenCalled();
    })

    it('renders the floating island with inputs', () => {
        render(
            <LanguageProvider>
                <Home />
            </LanguageProvider>
        )
        expect(screen.getByPlaceholderText('Where are you?')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Where to?')).toBeInTheDocument()
        expect(screen.getByText('Launch')).toBeInTheDocument()
    })
})
