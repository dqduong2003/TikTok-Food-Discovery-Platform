import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Place } from '../types';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; 

interface MapComponentProps {
  places: Place[];
  activePlaceId: number | null;
  onMarkerClick: (place: Place) => void;
  onMarkerMouseEnter: (id: number) => void;
  onMarkerMouseLeave: () => void;
  // --- ADDED PROP ---
  forcedCenter: { lng: number; lat: number } | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  places, 
  activePlaceId, 
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
  forcedCenter // --- DESTRUCTURED HERE ---
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

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      marker: false,
      placeholder: 'Search for an area...',
      collapsed: true,
    });

    mapRef.current.addControl(geocoder, 'top-left');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // --- NEW: HANDLE INTELLIGENT FLY TO ---
  useEffect(() => {
    if (mapRef.current && forcedCenter) {
      mapRef.current.flyTo({
        center: [forcedCenter.lng, forcedCenter.lat],
        zoom: 14,
        speed: 1.2,
        curve: 1.4,
        essential: true 
      });
    }
  }, [forcedCenter]); // Only triggers when the detected location changes

  // 2. Create Markers
  useEffect(() => {
    if (!mapRef.current) return;

    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find((p) => p.id === Number(id))) {
        markersRef.current[Number(id)].remove();
        delete markersRef.current[Number(id)];
      }
    });

    places.forEach((place) => {
      if (!markersRef.current[place.id]) {
        const el = document.createElement('div');
        el.className = 'marker-wrapper';

        const dot = document.createElement('div');
        dot.className = 'marker-visual'; 
        dot.style.backgroundColor = place.color || '#e2725b';
        
        const label = document.createElement('div');
        label.className = 'marker-label';
        label.innerText = place.name;

        el.appendChild(dot);
        el.appendChild(label);

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

  // 3. Handle Active State
  useEffect(() => {
    Object.keys(markersRef.current).forEach((id) => {
        const marker = markersRef.current[Number(id)];
        const el = marker.getElement();
        
        const dot = el.querySelector('.marker-visual') as HTMLElement;
        const label = el.querySelector('.marker-label') as HTMLElement;
        
        if (Number(id) === activePlaceId) {
          el.style.zIndex = '50';
          label.classList.add('active');
        } else {
          el.style.zIndex = '1';
          label.classList.remove('active');
        }
    });
  }, [activePlaceId]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-[30px] overflow-hidden" />;
};

export default MapComponent;