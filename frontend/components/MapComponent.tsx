import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Place } from '../types';

mapboxgl.accessToken = ""; 

interface MapComponentProps {
  places: Place[];
  activePlaceId: number | null;
  onMarkerClick: (place: Place) => void;
  // NEW: Add hover handlers to sync with App state
  onMarkerMouseEnter: (id: number) => void;
  onMarkerMouseLeave: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  places, 
  activePlaceId, 
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});

  // 1. Initialize Map
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

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

// 2. Create Markers
useEffect(() => {
  if (!mapRef.current) return;

  // Cleanup old markers
  Object.keys(markersRef.current).forEach((id) => {
    if (!places.find((p) => p.id === Number(id))) {
      markersRef.current[Number(id)].remove();
      delete markersRef.current[Number(id)];
    }
  });

  // Add new markers
  places.forEach((place) => {
    if (!markersRef.current[place.id]) {
      
      // --- Wrapper ---
      const el = document.createElement('div');
      el.className = 'marker-wrapper relative group';

      // --- 1. The Visual Dot (Removed marker-pulse) ---
      const dot = document.createElement('div');
      dot.className = `
          marker-visual w-6 h-6 border-[3px] border-white rounded-full 
          transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] 
          shadow-[0_4px_6px_rgba(0,0,0,0.1)] cursor-pointer 
      `; // <--- 'marker-pulse' removed from here
      dot.style.backgroundColor = place.color || '#e2725b';
      
      // --- 2. The Label (Tooltip) ---
      const label = document.createElement('div');
      label.className = `
          marker-label absolute bg-[#2d2a28] text-white px-4 py-2 rounded 
          font-['Space_Mono'] text-[0.7rem] whitespace-nowrap pointer-events-none
          shadow-[5px_5px_0px_#8a9a5b] transition-all duration-300 left-1/2 -translate-x-1/2
      `;
      label.innerText = place.name;
      
      // Default Hidden State
      label.style.opacity = '0';
      label.style.transform = 'translate(-50%, 0px)'; 
      label.style.bottom = '35px';

      // Append to wrapper
      el.appendChild(dot);
      el.appendChild(label);

      // --- Events ---
      el.addEventListener('mouseenter', () => onMarkerMouseEnter(place.id));
      el.addEventListener('mouseleave', () => onMarkerMouseLeave());
      el.addEventListener('click', (e) => {
          e.stopPropagation();
          mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: 15 });
          onMarkerClick(place);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.lng, place.lat])
        .addTo(mapRef.current!);

      markersRef.current[place.id] = marker;
    }
  });
}, [places, onMarkerClick, onMarkerMouseEnter, onMarkerMouseLeave]);

  // 3. Handle Active State (Scale Dot + Show Label)
  useEffect(() => {
    Object.keys(markersRef.current).forEach((id) => {
        const marker = markersRef.current[Number(id)];
        const el = marker.getElement();
        
        const dot = el.querySelector('.marker-visual') as HTMLElement;
        const label = el.querySelector('.marker-label') as HTMLElement;
        
        if (Number(id) === activePlaceId) {
            // ACTIVE STATE
            el.style.zIndex = '50'; // Bring to front
            
            if (dot) {
                dot.style.transform = 'scale(1.5)';
                // Optional: Stop pulsing when active if it's distracting? 
                // dot.classList.remove('marker-pulse'); 
            }
            if (label) {
                label.style.opacity = '1';
                label.style.transform = 'translate(-50%, -10px)'; // Little float up animation
            }
        } else {
            // INACTIVE STATE
            el.style.zIndex = '1';
            
            if (dot) {
                dot.style.transform = 'scale(1)';
            }
            if (label) {
                label.style.opacity = '0';
                label.style.transform = 'translate(-50%, 0px)';
            }
        }
    });
  }, [activePlaceId]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-[30px] overflow-hidden" />;
};

export default MapComponent;