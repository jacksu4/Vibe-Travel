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

describe('Home Page', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'mock-token';
    });

    it('renders the map background', () => {
        render(<Home />)
        expect(screen.getByTestId('mapbox-map')).toBeInTheDocument()
    })

    it('renders the floating island with inputs', () => {
        render(<Home />)
        expect(screen.getByPlaceholderText('Where are you?')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Where to?')).toBeInTheDocument()
        expect(screen.getByText('Launch')).toBeInTheDocument()
    })
})
