"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapBackground from '@/components/MapBackground';
import FloatingIsland from '@/components/FloatingIsland';
import WaypointPopup from '@/components/WaypointPopup';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [showHero, setShowHero] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isNearbyPlace, setIsNearbyPlace] = useState(false);
  const [isIslandCollapsed, setIsIslandCollapsed] = useState(false);

  const LOADING_TEXTS = language === 'zh' ? LOADING_TEXTS_ZH : LOADING_TEXTS_EN;

  // Collapse island when trip is planned
  useEffect(() => {
    if (tripPlan) {
      setIsIslandCollapsed(true);
    }
  }, [tripPlan]);

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

  // Hide hero when trip is planned
  useEffect(() => {
    if (tripPlan) {
      setShowHero(false);
    }
  }, [tripPlan]);

  const handleSearch = async (start: string, end: string, vibe: number, days: number) => {
    setIsSearching(true);
    setTripPlan(null);
    setSelectedWaypoint(null);

    const startTime = Date.now();
    console.log(`🚀 Planning trip: ${start} → ${end}`);

    try {
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, vibe, days, language })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to plan trip');
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      console.log(`✅ Trip planned in ${duration}ms:`, data.waypoints?.length || 0, 'waypoints');
      setTripPlan(data);
    } catch (error) {
      console.error('Trip planning error:', error);
      alert(t('errors.planningFailed') || 'Failed to plan trip. Please check your API keys and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWaypointClick = async (waypoint: any, isNearby = false) => {
    console.log(`👆 Clicked waypoint: ${waypoint.name}, isNearby: ${isNearby}`);
    setSelectedWaypoint(waypoint);
    setIsNearbyPlace(isNearby);
    
    // Only fetch nearby places for main waypoints, not for nearby places themselves
    if (!isNearby) {
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
          setNearbyPlaces(data.nearby_places || []);
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
    if (!tripPlan || !selectedWaypoint) return;
    const index = tripPlan.waypoints.indexOf(selectedWaypoint);
    if (index < tripPlan.waypoints.length - 1) {
      // Clear nearby places immediately when navigating
      setNearbyPlaces([]);
      handleWaypointClick(tripPlan.waypoints[index + 1], false);
    }
  };

  const handlePrevWaypoint = () => {
    if (!tripPlan || !selectedWaypoint) return;
    const index = tripPlan.waypoints.indexOf(selectedWaypoint);
    if (index > 0) {
      // Clear nearby places immediately when navigating
      setNearbyPlaces([]);
      handleWaypointClick(tripPlan.waypoints[index - 1], false);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0F1115] text-white font-sans">
      <MapBackground
        routeGeoJSON={tripPlan?.route}
        waypoints={tripPlan?.waypoints}
        startLocation={tripPlan?.start}
        endLocation={tripPlan?.end}
        onWaypointClick={(wp) => handleWaypointClick(wp, false)}
        selectedWaypoint={selectedWaypoint}
        extraWaypoints={tripPlan?.extraSuggestions}
        nearbyPlaces={nearbyPlaces}
        onNearbyClick={(place) => handleWaypointClick(place, true)}
      />

      {/* Language Toggle */}
      <LanguageToggle />

      {/* Hero Section */}
      <AnimatePresence>
        {showHero && !tripPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center space-y-6 px-4">
              {/* Background glow for better visibility */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative"
              >
                <h1 className="text-7xl md:text-8xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  {t('hero.title')}
                </h1>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative"
              >
                <p className="text-xl md:text-2xl font-light tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full inline-block">
                  {t('hero.subtitle')}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="relative"
              >
                <p className="text-sm md:text-base font-light tracking-wider text-white/90 italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/20 backdrop-blur-sm px-4 py-1 rounded-full inline-block">
                  {t('hero.tagline')}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {!selectedWaypoint && (
          <FloatingIsland 
            key="island" 
            onSearch={handleSearch} 
            isSearching={isSearching}
            isCollapsed={isIslandCollapsed}
            onToggleCollapse={() => setIsIslandCollapsed(!isIslandCollapsed)}
          />
        )}

        {selectedWaypoint && (
          <WaypointPopup
            key="popup"
            waypoint={selectedWaypoint}
            onClose={() => {
              setSelectedWaypoint(null);
              setNearbyPlaces([]);
              setIsNearbyPlace(false);
            }}
            onNext={!isNearbyPlace ? handleNextWaypoint : undefined}
            onPrev={!isNearbyPlace ? handlePrevWaypoint : undefined}
            hasPrev={!isNearbyPlace && !!tripPlan && tripPlan.waypoints.indexOf(selectedWaypoint) > 0}
            hasNext={!isNearbyPlace && !!tripPlan && tripPlan.waypoints.indexOf(selectedWaypoint) < tripPlan.waypoints.length - 1}
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
