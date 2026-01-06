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
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('rating');
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. NEW: Create a Ref to store card DOM elements
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // FETCH
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true);
      try {
        const url = searchTerm 
          ? `http://localhost:4000/api/search?q=${encodeURIComponent(searchTerm)}`
          : `http://localhost:4000/api/search`;
        
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          const adapted = json.data.map(transformBackendData);
          setPlaces(adapted);
        }
      } catch (err) {
        console.error("Failed to fetch venues:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchVenues, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. NEW: Scroll to the active item whenever activePlaceId changes
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
        <div className="brand">
          <p className="font-['Space_Mono'] text-[0.8rem] mb-2.5 text-gray-500">EST. 2026</p>
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
            className="w-full bg-white/70 backdrop-blur-md border-2 border-[#2d2a28] py-[15px] px-[25px] rounded-full font-['Space_Mono'] text-[1rem] outline-none transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] focus:bg-white focus:shadow-[10px_10px_0px_#e2725b] focus:-translate-x-1 focus:-translate-y-1"
          />
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
               // 3. NEW: Wrap in div and attach REF here
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
           />
        </div>

      </main>

      {/* Modal */}
      {selectedPlace && (
        <ReviewModal 
            place={selectedPlace} 
            onClose={() => setSelectedPlace(null)} 
        />
      )}
    </div>
  );
};

export default App;