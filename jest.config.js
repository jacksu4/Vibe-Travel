const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^react-map-gl$': '<rootDir>/__mocks__/react-map-gl.js',
        '^mapbox-gl$': '<rootDir>/__mocks__/mapbox-gl.js',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(react-map-gl|mapbox-gl|lucide-react)/)'
    ],
}

module.exports = createJestConfig(customJestConfig)
