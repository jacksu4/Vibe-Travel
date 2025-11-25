/**
 * Cache module for storing trip planning results and geocoding results in memory.
 * 
 * This provides simple Map-based caches to avoid redundant API calls.
 * 
 * @example
 * ```typescript
 * import { tripPlanCache, geocodingCache, photoCache } from '@/lib/cache';
 * 
 * // Check cache before API call
 * if (tripPlanCache.has(key)) {
 *   return tripPlanCache.get(key);
 * }
 * 
 * // Store result after API call
 * tripPlanCache.set(key, result);
 * ```
 */

// Simple in-memory cache for trip plans
// Uses Map for O(1) lookups
export const tripPlanCache = new Map<string, any>();

// Simple in-memory cache for geocoding results
// Reduces redundant Mapbox API calls for the same location
export const geocodingCache = new Map<string, [number, number] | null>();

// Simple in-memory cache for place photos
// Reduces redundant Google Places API calls
export const photoCache = new Map<string, string>();
