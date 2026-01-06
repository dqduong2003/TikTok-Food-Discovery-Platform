import React, { useEffect, useState } from 'react';
import { Place, TikTokReview } from '../types';
import { fetchTikTokReviews } from '../services/geminiService';

interface ReviewModalProps {
  place: Place;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ place, onClose }) => {
  const [reviews, setReviews] = useState<TikTokReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      setLoading(true);
      const data = await fetchTikTokReviews(place.name);
      if (isMounted) {
        setReviews(data);
        setLoading(false);
      }
    };
    loadReviews();
    return () => { isMounted = false; };
  }, [place.name]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-[#2d2a28]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#fdfaf6] w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border-4 border-[#2d2a28]">
        
        {/* Header */}
        <div className="p-8 border-b-2 border-dashed border-[#2d2a28] flex justify-between items-start bg-white">
          <div>
            <h2 className="text-3xl font-[800] text-[#2d2a28] mb-2">{place.name}</h2>
            <p className="font-['Space_Mono'] text-[#e2725b]">TIKTOK BUZZ CHECK</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#2d2a28] hover:text-white rounded-full transition-colors border border-[#2d2a28]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-[#e2725b] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-['Space_Mono'] animate-pulse text-[#2d2a28]">Curating viral moments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-[#2d2a28]/10 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-sm bg-black text-white px-2 py-1 rounded">@{review.author}</span>
                    <span className="text-xs font-['Space_Mono'] text-gray-500">{review.datePosted}</span>
                  </div>
                  
                  <p className="text-[#2d2a28] font-medium mb-4 leading-snug">
                    "{review.summary}"
                  </p>
                  
                  <div className="space-y-2 mb-4">
                     <div className="flex items-baseline gap-2 text-sm">
                        <span className="text-[#e2725b] font-bold uppercase text-xs tracking-wider">Vibes:</span>
                        <span className="text-gray-700">{review.vibes}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 text-sm">
                        <span className="text-[#8a9a5b] font-bold uppercase text-xs tracking-wider w-full">Must Try:</span>
                        {review.featuredDishes.map((dish, dIdx) => (
                            <span key={dIdx} className="bg-[#f0f4e8] px-2 py-1 rounded text-xs text-[#5d6b3b] border border-[#dce3cf]">{dish}</span>
                        ))}
                     </div>
                  </div>

                  <a 
                    href="#" 
                    className="block w-full text-center py-2 border border-[#2d2a28] rounded-lg text-xs font-['Space_Mono'] hover:bg-[#2d2a28] hover:text-white transition-colors"
                  >
                    WATCH ORIGINAL VIDEO
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
