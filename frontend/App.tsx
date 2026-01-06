import React, { useState, useMemo } from 'react';
import { Place } from './types';
import { PlaceCard } from './components/PlaceCard';
import { ReviewModal } from './components/ReviewModal';

const INITIAL_PLACES: Place[] = [
  { id: 1, name: "The Clay Oven", addr: "42 Terrazzo Lane", rating: 4.9, reviews: 128, text: "The crust is like porous stone, light and perfectly charred.", x: 30, y: 40, color: '#e2725b' },
  { id: 2, name: "Sage & Stone", addr: "88 Mineral Blvd", rating: 4.7, reviews: 342, text: "Earthy interiors with a focus on cold-pressed extractions.", x: 70, y: 20, color: '#8a9a5b' },
  { id: 3, name: "Cobalt Coffee", addr: "15 Industrial St", rating: 4.5, reviews: 890, text: "The espresso has a mineral depth that lingers beautifully.", x: 50, y: 65, color: '#2e5a88' },
  { id: 4, name: "Basalt Bistro", addr: "9 Volcanic Ave", rating: 4.8, reviews: 56, text: "Intimate seating with textures that invite conversation.", x: 20, y: 80, color: '#2d2a28' },
  { id: 5, name: "Pebble Patisserie", addr: "102 Sand Circle", rating: 4.2, reviews: 1205, text: "Delicate layers that crumble into a sweet silt.", x: 80, y: 75, color: '#d4a373' }
];

type SortCriteria = 'rating' | 'reviews';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('rating');
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const filteredPlaces = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let result = INITIAL_PLACES.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.text.toLowerCase().includes(term)
    );

    return result.sort((a, b) => {
      if (sortCriteria === 'rating') return b.rating - a.rating;
      if (sortCriteria === 'reviews') return b.reviews - a.reviews;
      return 0;
    });
  }, [searchTerm, sortCriteria]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-[60px] py-[40px] flex justify-between items-end relative z-10">
        <div className="brand">
          <p className="font-['Space_Mono'] text-[0.8rem] mb-2.5">EST. 2024</p>
          <h1 className="font-[800] text-[3rem] tracking-[-2px] lowercase leading-[0.8] text-[#2d2a28]">
            porous.<br/>epicure
          </h1>
        </div>
        <div className="relative w-[400px]">
          <input 
            type="text" 
            placeholder="Search: e.g. 'Artisan Sourdough'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/70 backdrop-blur-md border-2 border-[#2d2a28] py-[15px] px-[25px] rounded-full font-['Space_Mono'] text-[1rem] outline-none transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] focus:bg-white focus:shadow-[10px_10px_0px_#e2725b] focus:-translate-x-1 focus:-translate-y-1"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-[450px_1fr] flex-grow px-[60px] pb-[40px] gap-[40px] overflow-hidden">
        
        {/* Sidebar */}
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
          
          <div className="overflow-y-auto pr-[15px] pb-10 custom-scrollbar mask-image-gradient flex-grow">
             {filteredPlaces.map((place, index) => (
               <PlaceCard 
                 key={place.id}
                 place={place}
                 index={index}
                 isActive={activePlaceId === place.id}
                 onMouseEnter={() => setActivePlaceId(place.id)}
                 onMouseLeave={() => setActivePlaceId(null)}
                 onClick={() => setSelectedPlace(place)}
               />
             ))}
             {filteredPlaces.length === 0 && (
                <div className="p-8 text-center font-['Space_Mono'] text-gray-500 italic">
                    No places found hiding in the terrazzo.
                </div>
             )}
          </div>
        </div>

        {/* Map Viewport */}
        <div className="hidden lg:block bg-[#e9e4df] rounded-[60px] relative overflow-hidden border-2 border-[#2d2a28] shadow-[inset_0_0_50px_rgba(0,0,0,0.05)]">
            <div className="map-grid-pattern absolute w-[200%] h-[200%] -top-1/2 -left-1/2 -rotate-[15deg] pointer-events-none"></div>
            
            {INITIAL_PLACES.map(place => {
                const isActive = activePlaceId === place.id;
                return (
                    <div 
                        key={place.id}
                        className={`
                            absolute w-6 h-6 border-[3px] border-white rounded-full 
                            transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 marker-pulse
                            cursor-pointer
                        `}
                        style={{ 
                            left: `${place.x}%`, 
                            top: `${place.y}%`, 
                            backgroundColor: place.color,
                            transform: isActive ? 'translate(-50%, -50%) scale(2)' : 'translate(-50%, -50%) scale(1)',
                            zIndex: isActive ? 20 : 10
                        }}
                        onMouseEnter={() => setActivePlaceId(place.id)}
                        onMouseLeave={() => setActivePlaceId(null)}
                        onClick={() => setSelectedPlace(place)}
                    >
                         <div 
                            className={`
                                absolute bg-[#2d2a28] text-white px-4 py-2 rounded font-['Space_Mono'] text-[0.7rem] whitespace-nowrap pointer-events-none
                                shadow-[5px_5px_0px_#8a9a5b] transition-all duration-300 left-1/2
                            `}
                            style={{
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'translateY(-40px) translateX(-50%)' : 'translateY(0) translateX(-50%)'
                            }}
                         >
                            {place.name}
                         </div>
                    </div>
                );
            })}
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
