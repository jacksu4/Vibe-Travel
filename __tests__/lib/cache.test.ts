import { tripPlanCache } from '@/lib/cache';

describe('Cache Library', () => {
    beforeEach(() => {
        tripPlanCache.clear();
    });

    it('should store and retrieve cached trip plans', () => {
        const key = 'test-key';
        const value = { test: 'data' };

        tripPlanCache.set(key, value);
        expect(tripPlanCache.has(key)).toBe(true);
        expect(tripPlanCache.get(key)).toEqual(value);
    });

    it('should return false for non-existent keys', () => {
        expect(tripPlanCache.has('non-existent')).toBe(false);
    });

    it('should clear all cached data', () => {
        tripPlanCache.set('key1', { data: 1 });
        tripPlanCache.set('key2', { data: 2 });

        tripPlanCache.clear();

        expect(tripPlanCache.has('key1')).toBe(false);
        expect(tripPlanCache.has('key2')).toBe(false);
    });
});
