import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Polyfill Request and Response for Next.js API route testing
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        url: string;
        method: string;
        headers: Headers;
        body: any;
        constructor(input: string | Request, init?: any) {
            this.url = typeof input === 'string' ? input : input.url;
            this.method = init?.method || 'GET';
            this.headers = new Headers(init?.headers);
            this.body = init?.body;
        }
        async json() {
            return JSON.parse(this.body);
        }
    } as any;
}

if (typeof global.Response === 'undefined') {
    global.Response = class Response {
        status: number;
        body: any;
        constructor(body?: any, init?: any) {
            this.body = body;
            this.status = init?.status || 200;
        }
        async json() {
            return this.body;
        }
    } as any;
}

if (typeof global.Headers === 'undefined') {
    global.Headers = class Headers {
        map: Map<string, string>;
        constructor(init?: any) {
            this.map = new Map();
            if (init) {
                Object.keys(init).forEach(key => this.map.set(key, init[key]));
            }
        }
        get(key: string) { return this.map.get(key); }
        set(key: string, value: string) { this.map.set(key, value); }
    } as any;
}

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    auth: {
        currentUser: null,
        onAuthStateChanged: jest.fn(() => jest.fn()), // Return unsubscribe function
        signOut: jest.fn(),
    },
    db: {},
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
}));

// Mock react-markdown
jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const React = require('react');
        return React.createElement('div', null, children);
    },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const React = require('react');
        return React.createElement('div', null, children);
    },
    motion: {
        div: ({ children, ...props }: any) => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const React = require('react');
            return React.createElement('div', props, children);
        },
        button: ({ children, ...props }: any) => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const React = require('react');
            return React.createElement('button', props, children);
        },
    },
}));
