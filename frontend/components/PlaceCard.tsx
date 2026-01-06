import React from 'react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  index: number;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ 
  place, 
  index, 
  isActive, 
  onMouseEnter, 
  onMouseLeave,
  onClick
}) => {
  return (
    <div 
      className={`
        bg-white p-6 mb-5 rounded-tr-lg rounded-bl-lg rounded-tl-[40px] rounded-br-[40px]
        border border-black/10 transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
        cursor-pointer animate-slide-up opacity-0 fill-mode-forwards
        hover:scale-[1.02] hover:-rotate-1 hover:shadow-[15px_15px_0px_rgba(138,154,91,0.2)] hover:border-[#8a9a5b]
        ${isActive ? 'scale-[1.02] -rotate-1 shadow-[15px_15px_0px_rgba(138,154,91,0.2)] border-[#8a9a5b]' : ''}
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <h3 className="text-[1.4rem] font-[800] mb-1 text-[#2d2a28]">{place.name}</h3>
      <span className="font-['Space_Mono'] text-xs text-[#666] mb-4 block">{place.addr}</span>
      <p className="text-sm italic leading-relaxed text-[#444] mb-5">"{place.text}"</p>
      <div className="flex justify-between items-center pt-4 border-t border-dashed border-[#ccc]">
        <span className="font-['Space_Mono'] bg-[#2d2a28] text-white px-3 py-1 rounded font-bold text-sm">
          {place.rating} / 5.0
        </span>
        <span className="text-[0.7rem] uppercase tracking-wider font-medium text-[#2d2a28]">
          {place.reviews} verified reviews
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[#e2725b] text-xs font-bold font-['Space_Mono'] group">
        <span>VIEW TIKTOK REVIEWS</span>
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
};
