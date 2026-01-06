import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Place } from '../types'; // Import your shared type

// Use your env variable
mapboxgl.accessToken = "pk.eyJ1IjoiZHFkdW9uZzIwMDMiLCJhIjoiY21rMjd5YTM2MGQ4bTNjcTE1a3dmYWg3aSJ9.P9rfUsEHr-jgGhaM-Rep-Q"; 

interface MapComponentProps {
  places: Place[];
  activePlaceId: number | null;
  onMarkerClick: (place: Place) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ places, activePlaceId, onMarkerClick }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});

 // Initialize Map
 useEffect(() => {
  if (mapRef.current || !mapContainerRef.current) return;

  mapRef.current = new mapboxgl.Map({
    container: mapContainerRef.current,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [144.9631, -37.8136],
    zoom: 13,
    dragPan: true,
    scrollZoom: true,
  });

  mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

  // --- CLEANUP FUNCTION ---
  return () => {
    mapRef.current?.remove();   // Remove the map from DOM
    mapRef.current = null;      // CRITICAL: Reset the ref so a new map can be created
    markersRef.current = {};    // Reset markers cache so they get recreated
  };
}, []); // Run only once on mount

  // Sync Markers when 'places' change
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Remove old markers not in current list
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find((p) => p.id === Number(id))) {
        markersRef.current[Number(id)].remove();
        delete markersRef.current[Number(id)];
      }
    });

    // 2. Add/Update markers
    places.forEach((place) => {
      if (!markersRef.current[place.id]) {
        // Create a DOM element for the marker
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundColor = place.color || '#e2725b';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        el.style.transition = 'transform 0.2s ease';

        // Add click listener
        el.addEventListener('click', () => {
             // Center map on click (optional)
             mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: 15 });
             onMarkerClick(place);
        });

        // Add to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([place.lng, place.lat])
          .addTo(mapRef.current!);

        markersRef.current[place.id] = marker;
      }
    });
  }, [places, onMarkerClick]);

    // Handle Active State (Hover from sidebar)
    useEffect(() => {
        // 1. Fix: Add ': mapboxgl.Marker' to the loop variable
        Object.values(markersRef.current).forEach((marker: mapboxgl.Marker) => {
            const el = marker.getElement();
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';
        });

        // Highlight active marker
        if (activePlaceId && markersRef.current[activePlaceId]) {
            const marker = markersRef.current[activePlaceId];
            const el = marker.getElement();
            el.style.transform = 'scale(1.5)';
            el.style.zIndex = '10';
        }
    }, [activePlaceId]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-[30px] overflow-hidden" />;
};

export default MapComponent;