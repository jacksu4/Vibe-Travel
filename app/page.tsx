
"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapBackground from '@/components/MapBackground';
import FloatingIsland from '@/components/FloatingIsland';
import WelcomeOverlay from '@/components/WelcomeOverlay'; // New import
import AuthModal from '@/components/AuthModal'; // New import
import HistoryButton from '@/components/HistoryButton'; // New import
import TripJournal from '@/components/TripJournal'; // New import
import UserMenu from '@/components/UserMenu'; // New import
import WaypointPopup from '@/components/WaypointPopup'; // Still needed
import LanguageToggle from '@/components/LanguageToggle'; // Still needed
import { useLanguage } from '@/contexts/LanguageContext';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const LOADING_TEXTS_EN = [
  "Scanning local blogs...",
  "Avoiding tourist traps...",
  "Calculating vibe resonance...",
  "Finding the path less traveled...",
  "Consulting the stars...",
  "Optimizing for serendipity..."
];

const LOADING_TEXTS_ZH = [
  "扫描本地博客...",
  "避开游客陷阱...",
  "计算氛围共鸣...",
  "寻找少有人走的路...",
  "咨询星象...",
  "优化偶遇机会..."
];

export default function Home() {
  const { language, t } = useLanguage();
  const [isSearching, setIsSearching] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [waypoints, setWaypoints] = useState<any[]>([]); // New state
  const [extraWaypoints, setExtraWaypoints] = useState<any[]>([]); // New state
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null); // New state
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isNearbyPlace, setIsNearbyPlace] = useState(false);

  const [parentWaypoint, setParentWaypoint] = useState<any>(null); // Track the parent waypoint when viewing nearby places
  const [nearbyCache, setNearbyCache] = useState<Map<string, any[]>>(new Map()); // Cache nearby places by waypoint coordinates

  // Auth & History State
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [itineraryContent, setItineraryContent] = useState('');
  const [currentTripTitle, setCurrentTripTitle] = useState('');

  const LOADING_TEXTS = language === 'zh' ? LOADING_TEXTS_ZH : LOADING_TEXTS_EN;



  // Cycle through loading texts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      let i = 0;
      setLoadingText(LOADING_TEXTS[0]);
      interval = setInterval(() => {
        i = (i + 1) % LOADING_TEXTS.length;
        setLoadingText(LOADING_TEXTS[i]);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isSearching, LOADING_TEXTS]);


  const [isPlanningMinimized, setIsPlanningMinimized] = useState(false);

  // Auth & History Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveTrip = async (tripData: any, start: string, end: string, vibe: number, days: number, itinerary: string) => {
    if (!user) return;

    try {
      // Convert nested arrays to JSON strings for Firestore compatibility
      await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        start_location: start,
        end_location: end,
        vibe: vibe,
        days: days,
        waypoints: JSON.stringify(tripData.waypoints), // Serialize to avoid nested array error
        route_geojson: JSON.stringify(tripData.route), // Serialize to avoid nested array error
        itinerary_content: itinerary,
        title: `${start} to ${end}`,
        createdAt: serverTimestamp()
      });
      console.log('Trip saved successfully!');
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleRestoreTrip = (trip: any) => {
    // Reset state
    setSelectedWaypoint(null);
    setNearbyPlaces([]);
    setIsNearbyPlace(false);
    setParentWaypoint(null);

    // Load trip data (parse JSON strings back to objects)
    setWaypoints(JSON.parse(trip.waypoints) || []);
    setRouteGeoJSON(JSON.parse(trip.route_geojson));
    setItineraryContent(trip.itinerary_content || '');
    setCurrentTripTitle(`${trip.start_location} to ${trip.end_location}`);

    // Show journal if content exists
    if (trip.itinerary_content) {
      setIsJournalOpen(true);
    }
  };

  const handleSearch = async (waypoints: string[], vibe: number, days: number, customPreferences: string) => {
    setIsSearching(true);
    // Reset previous state
    setWaypoints([]);
    setRouteGeoJSON(null);
    setSelectedWaypoint(null);
    setNearbyPlaces([]);
    setItineraryContent('');
    setCurrentTripTitle(`${waypoints[0]} to ${waypoints[waypoints.length - 1]}`);

    const startTime = Date.now();
    console.log(`🚀 Planning multi-waypoint trip: ${waypoints.join(' → ')}`);

    // Check Local Storage Cache
    const cacheKey = `trip_plan_${JSON.stringify({ waypoints, vibe, days, customPreferences, language })}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        console.log('⚡️ Using client-side cached trip plan');
        setWaypoints(data.waypoints);
        setRouteGeoJSON(data.route);
        setExtraWaypoints(data.extraSuggestions || []);
        if (data.itinerary) {
          setItineraryContent(data.itinerary);
          setIsJournalOpen(true);
        }
        setIsSearching(false);
        return;
      } catch (e) {
        console.error('Error parsing cached data', e);
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints, vibe, days, customPreferences, language })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to plan trip');
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      console.log(`✅ Trip planned in ${duration}ms:`, data.waypoints?.length || 0, 'waypoints');

      // Save to Local Storage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save to localStorage (quota exceeded?)', e);
      }

      setWaypoints(data.waypoints);
      setRouteGeoJSON(data.route);
      setExtraWaypoints(data.extraSuggestions || []);

      if (data.itinerary) {
        setItineraryContent(data.itinerary);
        setIsJournalOpen(true);
      }

      // Save to history if logged in
      if (user) {
        handleSaveTrip(data, waypoints[0], waypoints[waypoints.length - 1], vibe, days, data.itinerary);
      }

    } catch (error: any) {
      console.error('❌ Trip planning error:', error);
      alert(error.message || t('errors.planningFailed') || 'Failed to plan trip. Please check your API keys and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWaypointClick = async (waypoint: any, isNearby = false) => {
    console.log(`👆 Clicked waypoint: ${waypoint.name}, isNearby: ${isNearby}`);

    // If clicking a nearby place, save the current waypoint as parent
    if (isNearby && selectedWaypoint && !isNearbyPlace) {
      setParentWaypoint(selectedWaypoint);
    }

    setSelectedWaypoint(waypoint);
    setIsNearbyPlace(isNearby);

    // Only fetch nearby places for main waypoints, not for nearby places themselves
    if (!isNearby) {
      // Generate cache key from waypoint coordinates
      const cacheKey = `${waypoint.coordinates[0]},${waypoint.coordinates[1]}`;

      // Check cache first
      if (nearbyCache.has(cacheKey)) {
        console.log(`💾 Using cached nearby places for: ${waypoint.name}`);
        setNearbyPlaces(nearbyCache.get(cacheKey) || []);
        return; // Skip API call
      }

      // Fetch from API if not cached
      setIsLoadingNearby(true);
      setNearbyPlaces([]); // Clear old nearby places first

      const startTime = Date.now();
      console.log(`🔍 Fetching nearby places for: ${waypoint.name} at [${waypoint.coordinates}]`);

      try {
        const response = await fetch('/api/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: waypoint.name,
            coordinates: waypoint.coordinates,
            language
          })
        });

        if (response.ok) {
          const data = await response.json();
          const duration = Date.now() - startTime;
          console.log(`✅ Nearby places loaded in ${duration}ms:`, data.nearby_places?.length || 0, 'places');
          if (data.nearby_places && data.nearby_places.length > 0) {
            console.log('📍 Nearby places coordinates:', data.nearby_places.map((p: any) => `${p.name}: [${p.coordinates}]`).join(', '));
          }
          const places = data.nearby_places || [];
          setNearbyPlaces(places);

          // Store in cache
          setNearbyCache(prev => new Map(prev).set(cacheKey, places));
          console.log(`💾 Cached ${places.length} nearby places for: ${waypoint.name}`);
        } else {
          console.error('❌ Failed to fetch nearby places:', response.status);
          setNearbyPlaces([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch nearby places:', error);
        setNearbyPlaces([]);
      } finally {
        setIsLoadingNearby(false);
      }
    } else {
      // When clicking a nearby place, don't fetch more nearby places
      setNearbyPlaces([]);
    }
  };

  const handleNextWaypoint = () => {
    if (!waypoints || !selectedWaypoint) return;
    const index = waypoints.indexOf(selectedWaypoint);
    if (index < waypoints.length - 1) {
      // Clear nearby places immediately when navigating
      setNearbyPlaces([]);
      handleWaypointClick(waypoints[index + 1], false);
    }
  };

  const handlePrevWaypoint = () => {
    if (!waypoints || !selectedWaypoint) return;
    const index = waypoints.indexOf(selectedWaypoint);
    if (index > 0) {
      // Clear nearby places immediately when navigating
      setNearbyPlaces([]);
      handleWaypointClick(waypoints[index - 1], false);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0F1115] text-white font-sans">
      <MapBackground
        routeGeoJSON={routeGeoJSON}
        waypoints={waypoints}
        startLocation={waypoints[0]} // Assuming first waypoint is start
        endLocation={waypoints[waypoints.length - 1]} // Assuming last waypoint is end
        onWaypointClick={(wp) => handleWaypointClick(wp, false)}
        selectedWaypoint={selectedWaypoint}
        extraWaypoints={extraWaypoints}
        nearbyPlaces={nearbyPlaces}
        onNearbyClick={(place) => handleWaypointClick(place, true)}
      />

      {/* Language Toggle */}
      <LanguageToggle />

      {/* Hero Section - Replaced by WelcomeOverlay */}

      {/* Overlay for AI Reasoning Text */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <div className="text-center space-y-6">
              <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]" />
              <p className="text-xl font-light tracking-[0.2em] uppercase text-cyan-400 animate-pulse">
                {loadingText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interface */}
      <AnimatePresence mode="wait">
        {!selectedWaypoint && waypoints.length === 0 && (
          <WelcomeOverlay key="welcome" />
        )}

        <AuthModal
          key="auth-modal"
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        {user && (
          <HistoryButton
            key="history-btn"
            user={user}
            onRestoreTrip={handleRestoreTrip}
          />
        )}

        <TripJournal
          key="trip-journal"
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          content={itineraryContent}
          title={currentTripTitle}
        />

        <UserMenu
          user={user}
          onAuthClick={() => setIsAuthOpen(true)}
          onLogout={() => auth.signOut()}
        />

        <FloatingIsland
          key="floating-island"
          onSearch={handleSearch}
          isSearching={isSearching}
          isCollapsed={!!selectedWaypoint || isPlanningMinimized}
          onToggleCollapse={() => {
            if (selectedWaypoint) {
              setSelectedWaypoint(null);
            } else {
              setIsPlanningMinimized(!isPlanningMinimized);
            }
          }}
        />

        {selectedWaypoint && (
          <WaypointPopup
            key="popup"
            waypoint={selectedWaypoint}
            onClose={() => {
              // If viewing a nearby place, restore the parent waypoint
              if (isNearbyPlace && parentWaypoint) {
                console.log(`🔙 Closing nearby place, restoring parent waypoint: ${parentWaypoint.name}`);
                const cacheKey = `${parentWaypoint.coordinates[0]},${parentWaypoint.coordinates[1]}`;

                setSelectedWaypoint(parentWaypoint);
                setIsNearbyPlace(false);
                setParentWaypoint(null);

                // Restore from cache instead of re-fetching
                if (nearbyCache.has(cacheKey)) {
                  console.log(`💾 Restoring cached nearby places for: ${parentWaypoint.name}`);
                  setNearbyPlaces(nearbyCache.get(cacheKey) || []);
                } else {
                  // Fallback: fetch if somehow not cached
                  handleWaypointClick(parentWaypoint, false);
                }
              } else {
                // Otherwise, close the popup completely
                setSelectedWaypoint(null);
                setNearbyPlaces([]);
                setIsNearbyPlace(false);
                setParentWaypoint(null);
              }
            }}
            onNext={!isNearbyPlace ? handleNextWaypoint : undefined}
            onPrev={!isNearbyPlace ? handlePrevWaypoint : undefined}
            hasPrev={!isNearbyPlace && !!waypoints && waypoints.indexOf(selectedWaypoint) > 0}
            hasNext={!isNearbyPlace && !!waypoints && waypoints.indexOf(selectedWaypoint) < waypoints.length - 1}
            nearbyPlaces={!isNearbyPlace ? nearbyPlaces : []}
            isLoadingNearby={isLoadingNearby}
            onNearbyClick={(place) => handleWaypointClick(place, true)}
            isNearbyPlace={isNearbyPlace}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
