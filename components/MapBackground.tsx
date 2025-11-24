"use client";
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapBackgroundProps {
  routeGeoJSON?: any;
  waypoints?: any[];
  startLocation?: { coordinates: [number, number] };
  endLocation?: { coordinates: [number, number] };
  onWaypointClick?: (waypoint: any) => void;
  selectedWaypoint?: any;
  extraWaypoints?: any[];
  nearbyPlaces?: any[];
  onNearbyClick?: (place: any) => void;
}

export default function MapBackground({
  routeGeoJSON,
  waypoints,
  startLocation,
  endLocation,
  onWaypointClick,
  selectedWaypoint,
  extraWaypoints,
  nearbyPlaces,
  onNearbyClick
}: MapBackgroundProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const extraMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const nearbyMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');

  // Initialize Map
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError("Mapbox Token Required");
      return;
    }

    mapboxgl.accessToken = token;

    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [0, 20], // Global view
        zoom: 2.5, // Larger globe
        projection: 'globe', // Enable globe projection
        attributionControl: false
      });

      map.current.on('load', () => {
        addRouteLayer();
        // Start rotation if no route
        if (!routeGeoJSON) {
          spinGlobe();
        }
      });

      // Stop rotation on interaction
      map.current.on('mousedown', () => { userInteracting.current = true; });
      map.current.on('dragstart', () => { userInteracting.current = true; });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Rotation Logic
  const userInteracting = useRef(false);
  const rotationFrameRef = useRef<number | null>(null);
  
  const spinGlobe = () => {
    const mapInstance = map.current;
    if (!mapInstance || userInteracting.current || routeGeoJSON) {
      if (rotationFrameRef.current) {
        cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
      return;
    }

    const center = mapInstance.getCenter();
    center.lng -= 0.1; // Rotate west
    mapInstance.easeTo({ center, duration: 1000, easing: (n) => n });
    rotationFrameRef.current = requestAnimationFrame(spinGlobe);
  };

  // Stop rotation when route appears
  useEffect(() => {
    if (routeGeoJSON && rotationFrameRef.current) {
      cancelAnimationFrame(rotationFrameRef.current);
      rotationFrameRef.current = null;
      userInteracting.current = true; // Prevent restart
    }
  }, [routeGeoJSON]);

  // Handle Style Change
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle);
      map.current.once('style.load', () => {
        addRouteLayer();
        if (map.current) map.current.setProjection('globe'); // Re-apply globe
      });
    }
  }, [mapStyle]);

  const addRouteLayer = () => {
    if (!map.current) return;
    if (map.current.getSource('route')) return; // Already exists

    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#06b6d4', // Cyan
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // If we have route data, update it immediately
    if (routeGeoJSON) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: routeGeoJSON
      });
    }
  };

  const handleResetView = () => {
    if (map.current && routeGeoJSON) {
      const coordinates = routeGeoJSON.coordinates;
      const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: any) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 200, // More context (region/country view)
        duration: 2000,
        essential: true
      });
    }
  };

  // Sync Map with Selected Waypoint - zoom immediately when waypoint changes
  useEffect(() => {
    if (map.current && selectedWaypoint && selectedWaypoint.coordinates) {
      console.log(`🎯 Zooming to waypoint: ${selectedWaypoint.name} at [${selectedWaypoint.coordinates[0]}, ${selectedWaypoint.coordinates[1]}]`);
      
      // Fly to waypoint immediately with higher zoom and offset to prevent popup covering
      map.current.flyTo({
        center: selectedWaypoint.coordinates,
        zoom: 14.5, // Good balance for seeing waypoint + nearby area
        offset: [0, -150], // Offset upward so popup doesn't cover waypoint
        pitch: 0,
        bearing: 0,
        essential: true,
        duration: 1200
      });
    }
  }, [selectedWaypoint]);

  // Update Route
  useEffect(() => {
    if (map.current && map.current.getSource('route') && routeGeoJSON) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: routeGeoJSON
      });
      handleResetView();
    }
  }, [routeGeoJSON]);

  // Update Markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    extraMarkersRef.current.forEach(marker => marker.remove());
    extraMarkersRef.current = [];
    nearbyMarkersRef.current.forEach(marker => marker.remove());
    nearbyMarkersRef.current = [];

    // Start Marker
    if (startLocation) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-cyan-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(6,182,212,0.8)]';
      const marker = new mapboxgl.Marker(el)
        .setLngLat(startLocation.coordinates)
        .addTo(map.current);
      markersRef.current.push(marker);
    }

    // End Marker
    if (endLocation) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-pink-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(236,72,153,0.8)]';
      const marker = new mapboxgl.Marker(el)
        .setLngLat(endLocation.coordinates)
        .addTo(map.current);
      markersRef.current.push(marker);
    }

    // Waypoint Markers
    if (waypoints) {
      waypoints.forEach(wp => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center group z-20 relative';
        el.innerHTML = `
          <div class="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-black/60 transition-all shadow-lg shadow-black/50 hover:border-cyan-400/50">
            <div class="text-xs font-bold text-white">${wp.rating || '★'}</div>
          </div>
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white font-medium whitespace-nowrap shadow-lg pointer-events-none flex items-center gap-1">
            <span>${wp.name}</span>
            <span class="text-yellow-400 text-[8px]">★</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onWaypointClick) onWaypointClick(wp);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(wp.coordinates)
          .addTo(map.current!);
        markersRef.current.push(marker);
      });
    }

    // Extra Waypoints
    if (extraWaypoints) {
      extraWaypoints.forEach(wp => {
        const el = document.createElement('div');
        el.className = 'w-3 h-3 bg-white/50 rounded-full border border-black/20 cursor-pointer hover:scale-150 hover:bg-white transition-all';
        el.title = wp.name;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onWaypointClick) onWaypointClick(wp);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(wp.coordinates)
          .addTo(map.current!);
        extraMarkersRef.current.push(marker);
      });
    }
  }, [waypoints, extraWaypoints, startLocation, endLocation, onWaypointClick]);

  // Update Nearby Places Markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(marker => marker.remove());
    nearbyMarkersRef.current = [];

    // Add nearby place markers
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      console.log('Rendering nearby places:', nearbyPlaces.map(p => ({
        name: p.name,
        coordinates: p.coordinates
      })));
      
      const markers: mapboxgl.Marker[] = [];
      
      nearbyPlaces.forEach(place => {
        if (!place.coordinates || !Array.isArray(place.coordinates) || place.coordinates.length !== 2) {
          console.error('Invalid coordinates for place:', place.name, place.coordinates);
          return;
        }
        
        const el = document.createElement('div');
        el.className = 'group cursor-pointer z-30 relative';
        
        // Icon based on type
        const getIcon = (type: string) => {
          switch (type.toLowerCase()) {
            case 'food': return '🍴';
            case 'sight': return '📸';
            case 'shop': return '🛍️';
            case 'activity': return '🎯';
            default: return '📍';
          }
        };

        el.innerHTML = `
          <div class="w-12 h-12 bg-amber-500/95 backdrop-blur-md rounded-full border-2 border-white flex items-center justify-center hover:scale-125 transition-all shadow-xl hover:shadow-amber-500/60">
            <span class="text-xl">${getIcon(place.type)}</span>
          </div>
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-md border border-amber-500/50 rounded-lg text-xs text-white font-semibold whitespace-nowrap shadow-xl pointer-events-none opacity-100 transition-opacity min-w-max">
            <div class="flex items-center gap-2">
              <span>${place.name}</span>
              <span class="text-yellow-400 text-sm">★${place.rating}</span>
            </div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onNearbyClick) onNearbyClick(place);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(place.coordinates)
          .addTo(map.current!);
        markers.push(marker);
      });
      
      nearbyMarkersRef.current = markers;

      // Adjust view to show nearby places if needed (but don't zoom out too much)
      if (map.current && selectedWaypoint && nearbyPlaces.length > 0) {
        console.log(`📍 Adjusting view for ${nearbyPlaces.length} nearby places around ${selectedWaypoint.name}`);
        
        // Small delay to let markers render and initial zoom to complete
        setTimeout(() => {
          if (!map.current) return;
          
          const bounds = new mapboxgl.LngLatBounds();
          const allCoords: [number, number][] = [];
          
          // Include selected waypoint
          bounds.extend(selectedWaypoint.coordinates);
          allCoords.push([selectedWaypoint.coordinates[0], selectedWaypoint.coordinates[1]]);
          console.log(`  - Main waypoint: [${selectedWaypoint.coordinates[0].toFixed(6)}, ${selectedWaypoint.coordinates[1].toFixed(6)}]`);
          
          // Include all nearby places
          nearbyPlaces.forEach(place => {
            if (place.coordinates && Array.isArray(place.coordinates) && place.coordinates.length === 2) {
              const lng = parseFloat(place.coordinates[0]);
              const lat = parseFloat(place.coordinates[1]);
              
              if (isNaN(lng) || isNaN(lat)) {
                console.error(`  ❌ Invalid coordinates for ${place.name}:`, place.coordinates);
                return;
              }
              
              bounds.extend([lng, lat]);
              allCoords.push([lng, lat]);
              console.log(`  - ${place.name}: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`);
            }
          });

          // Check if all coordinates are too similar (within 0.001 degrees ~100m)
          const hasVariation = allCoords.some(coord => 
            Math.abs(coord[0] - allCoords[0][0]) > 0.001 || 
            Math.abs(coord[1] - allCoords[0][1]) > 0.001
          );

          if (!hasVariation) {
            console.warn(`⚠️  All nearby places have very similar coordinates, skipping fitBounds`);
            return;
          }

          // Fit bounds with appropriate padding, but keep relatively zoomed in
          map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 450, left: 80, right: 80 }, // More padding at bottom for popup
            minZoom: 13, // Don't zoom out too far
            maxZoom: 15.5, // Don't zoom in too close
            duration: 1800,
            essential: true
          });
          
          console.log(`✅ Map view adjusted to include ${allCoords.length} places with varying coordinates`);
        }, 1500); // Wait for initial waypoint zoom to complete first
      }
    }
  }, [nearbyPlaces, onNearbyClick, selectedWaypoint]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-1 flex flex-col gap-1">
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${mapStyle.includes('dark') ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
            title="Void Mode"
          >
            🌑
          </button>
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/light-v11')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${mapStyle.includes('light') ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
            title="Light Mode"
          >
            ☀️
          </button>
          <button
            onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${mapStyle.includes('satellite') ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
            title="Satellite Mode"
          >
            🌍
          </button>
        </div>

        {routeGeoJSON && (
          <button
            onClick={handleResetView}
            className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            title="Reset View"
          >
            ⤢
          </button>
        )}
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-500 z-50">
          {error}
        </div>
      )}
    </div>
  );
}
