module.exports = {
    Map: jest.fn(() => ({
        remove: jest.fn(),
        on: jest.fn((event, callback) => {
            if (event === 'load') {
                callback();
            }
        }),
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
};
