import React, { useState, useEffect, useRef } from 'react';
import { Place } from './types';
import { PlaceCard } from './components/PlaceCard';
import { ReviewModal } from './components/ReviewModal';
import MapComponent from './components/MapComponent';

// --- HELPERS ---

const transformBackendData = (backendRow: any): Place => {
  const colors = ['#e2725b', '#8a9a5b', '#2e5a88', '#2d2a28', '#d4a373'];
  const randomColor = colors[backendRow.id % colors.length];

  return {
    id: backendRow.id,
    name: backendRow.name,
    addr: backendRow.address || 'Unknown Address',
    rating: backendRow.cached_rating || 0,
    reviews: backendRow.review_count || 0,
    text: backendRow.consolidated_vibes?.[0] || "A hidden gem.",
    vibes: backendRow.consolidated_vibes || [],
    videoUrl: backendRow.preview_video_url,
    lat: backendRow.lat,
    lng: backendRow.lng,
    x: 0, 
    y: 0,
    color: randomColor
  };
};

// --- COMPONENT ---

type SortCriteria = 'rating' | 'reviews';

const App: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState(''); // Actual query sent to backend
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('rating');
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lng: number; lat: number } | null>(null);
  
  // 1. NEW: State for Help Popup
  const [showInstructions, setShowInstructions] = useState(false);

  // 2. Ref to store card DOM elements
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // FETCH - Only triggers when query changes (set by Enter key)
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

        const url = query 
          ? `${API_BASE}/api/search?q=${encodeURIComponent(query)}`
          : `${API_BASE}/api/search`;
        
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          const adapted = json.data.map(transformBackendData);
          setPlaces(adapted);

          if (json.meta && json.meta.center) {
            const [lng, lat] = json.meta.center;
            setMapCenter({ lng, lat });
          }
        }
      } catch (err) {
        console.error("Failed to fetch venues:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, [query]);

  // Scroll to the active item whenever activePlaceId changes
  useEffect(() => {
    if (activePlaceId !== null && itemRefs.current[activePlaceId]) {
      itemRefs.current[activePlaceId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // 'nearest' prevents it from jumping if already visible
      });
    }
  }, [activePlaceId]);

  // SORT
  const sortedPlaces = [...places].sort((a, b) => {
      if (sortCriteria === 'rating') return b.rating - a.rating;
      if (sortCriteria === 'reviews') return b.reviews - a.reviews;
      return 0;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f1ee]">
      
      {/* Header */}
      <header className="px-[60px] py-[30px] flex justify-between items-end relative z-10 shrink-0">
        <div className="brand flex flex-col items-start gap-2">
            <div className="flex items-center gap-4">
                <p className="font-['Space_Mono'] text-[0.8rem] text-gray-500">EST. 2026</p>
                {/* 3. NEW: Help Button */}
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="font-['Space_Mono'] bg-white/50 hover:bg-[#e2725b] hover:text-white backdrop-blur-sm border border-[#2d2a28] px-3 py-1 rounded-full text-xs font-bold transition-all"
                >
                  ? HOW TO USE
                </button>
            </div>
          
            <h1 className="font-[800] text-[3rem] tracking-[-2px] lowercase leading-[0.8] text-[#2d2a28]">
                reel food<br/>places.
            </h1>
        </div>

        <div className="relative w-[400px]">
          <input 
            type="text" 
            placeholder="Search: e.g. 'Matcha'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQuery(searchTerm);
              }
            }}
            className="peer w-full bg-white/70 backdrop-blur-md border-2 border-[#2d2a28] py-[15px] px-[25px] rounded-full font-['Space_Mono'] text-[1rem] outline-none transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] focus:bg-white focus:shadow-[10px_10px_0px_#e2725b] focus:-translate-x-1 focus:-translate-y-1"
          />

          {isLoading && (
            <div className="absolute right-6 top-1/2 
                  -mt-3
                  pointer-events-none 
                  transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] 
                  peer-focus:-translate-y-1 peer-focus:-translate-x-1">               
                  <svg className="animate-spin h-6 w-6 text-[#2d2a28]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-[450px_1fr] flex-grow px-[60px] pb-[40px] gap-[40px] overflow-hidden min-h-0">
        
        {/* Sidebar List */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex gap-[15px] mb-[20px] shrink-0">
            <button 
              onClick={() => setSortCriteria('rating')}
              className={`font-['Space_Mono'] text-[0.7rem] px-3 py-1.5 border border-[#2d2a28] rounded transition-all duration-200 ${sortCriteria === 'rating' ? 'bg-[#2d2a28] text-white' : 'bg-transparent hover:bg-[#2d2a28] hover:text-white'}`}
            >
              TOP RATED
            </button>
            <button 
              onClick={() => setSortCriteria('reviews')}
              className={`font-['Space_Mono'] text-[0.7rem] px-3 py-1.5 border border-[#2d2a28] rounded transition-all duration-200 ${sortCriteria === 'reviews' ? 'bg-[#2d2a28] text-white' : 'bg-transparent hover:bg-[#2d2a28] hover:text-white'}`}
            >
              MOST REVIEWS
            </button>
          </div>
          
          <div className="overflow-y-auto pr-[15px] pb-10 custom-scrollbar mask-image-gradient flex-grow relative">
              {isLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center font-['Space_Mono']">
                      Loading...
                  </div>
              )}

              {sortedPlaces.map((place, index) => (
                <div 
                  key={place.id} 
                  ref={(el) => (itemRefs.current[place.id] = el)}
                >
                  <PlaceCard 
                    place={place}
                    index={index}
                    isActive={activePlaceId === place.id}
                    onMouseEnter={() => setActivePlaceId(place.id)}
                    onMouseLeave={() => setActivePlaceId(null)}
                    onClick={() => setSelectedPlace(place)}
                  />
                </div>
              ))}
              
              {!isLoading && sortedPlaces.length === 0 && (
                 <div className="p-8 text-center font-['Space_Mono'] text-gray-500 italic">
                    No places found hiding in the terrazzo.
                 </div>
              )}
          </div>
        </div>

        {/* Map Viewport */}
        <div className="hidden lg:block h-full w-full relative rounded-[30px] border-2 border-[#2d2a28] overflow-hidden shadow-lg">
           <MapComponent 
              places={sortedPlaces}
              activePlaceId={activePlaceId}
              onMarkerClick={setSelectedPlace}
              onMarkerMouseEnter={(id) => setActivePlaceId(id)}
              onMarkerMouseLeave={() => setActivePlaceId(null)}
              forcedCenter={mapCenter}
           />
        </div>

      </main>

      {/* Review Modal */}
      {selectedPlace && (
        <ReviewModal 
            place={selectedPlace} 
            onClose={() => setSelectedPlace(null)} 
        />
      )}

      {/* Instructions Popup Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-xl bg-[#f4f1ea] border-4 border-[#2d2a28] rounded-xl p-6 shadow-[8px_8px_0px_#2d2a28] animate-in fade-in zoom-in duration-200">
            
            {/* Close Button */}
            <button 
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
                <svg className="w-6 h-6 text-[#2d2a28]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 className="text-2xl font-black mb-6 text-[#2d2a28] flex items-center gap-2">
                <span>🍱</span> How to use
            </h2>

            <p className="font-['Space_Mono'] text-[#2d2a28] text-sm mb-6 leading-relaxed">
              When you're looking for a place to eat, stop scrolling through hundreds of TikToks. We compile viral food videos for you and display them on an interactive map, so you can find a spot instantly.
            </p>

            <p className="font-['Space_Mono'] text-[#2d2a28] text-sm mb-6 leading-relaxed">
              <b>📌 Note:</b> The app currently operates on a custom dataset limited to <b><i>Melbourne and Sydney, Australia.</i></b>
            </p>

            <ul className="space-y-4 font-['Space_Mono'] text-[#2d2a28] text-sm">
                <li className="flex items-start gap-3">
                <span className="bg-[#e2725b] text-white font-bold rounded-md w-6 h-6 flex items-center justify-center shrink-0">1</span>
                <p><strong>Search by "Vibe" or "Dishes":</strong> Try natural phrases like <em>"Matcha Hawthorn"</em> or <em>"Desserts in Melbourne CBD"</em>.</p>
                </li>

                <li className="flex items-start gap-3">
                <span className="bg-[#2d2a28] text-white font-bold rounded-md w-6 h-6 flex items-center justify-center shrink-0">2</span>
                <p><strong>Explore the Map:</strong> The map will automatically fly to the best matches. Click any <span className="text-red-500">🟠 pin</span>.</p>
                </li>

                <li className="flex items-start gap-3">
                <span className="bg-[#2d2a28] text-white font-bold rounded-md w-6 h-6 flex items-center justify-center shrink-0">3</span>
                <p><strong>Watch & Go:</strong> Click the video preview to watch the full Reel for context.</p>
                </li>
            </ul>

            <div className="mt-8 pt-4 border-t-2 border-[#2d2a28]/10 text-center">
                <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-[#2d2a28] text-white font-bold py-3 rounded-lg hover:bg-[#e2725b] transition-colors"
                >
                Got it, let's eat!
                </button>
            </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;