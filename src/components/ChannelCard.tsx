import React from 'react';
import { Star, Tv, Radio } from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onFavoriteClick,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl bg-[#161922] hover:bg-[#1c202c] border border-white/5 hover:border-[#FF9933]/50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-[#FF9933]/5 overflow-hidden"
    >
      {/* Top Banner / Logo Container */}
      <div className="relative w-full h-28 sm:h-32 bg-[#222634]/60 flex items-center justify-center p-3 overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            loading="lazy"
            className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              // Hide broken image to fallback to icon
              (e.target as HTMLElement).style.display = 'none';
              const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-icon');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Fallback Icon when no logo or load error */}
        <div
          className={`fallback-icon flex flex-col items-center justify-center ${
            channel.logo ? 'hidden' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center text-[#FF9933] mb-1">
            <Radio className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Live Broadcast</span>
        </div>

        {/* Live Indicator Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-bold tracking-wider backdrop-blur-sm shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {/* Favorite Button */}
        <button
          onClick={onFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition ${
            isFavorite
              ? 'bg-[#FF9933] text-black shadow-sm'
              : 'bg-black/40 text-gray-300 hover:text-white hover:bg-black/60'
          }`}
          title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-black' : ''}`} />
        </button>

        {/* Resolution Badge */}
        {channel.resolution && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-gray-200 text-[9px] font-mono tracking-wider font-semibold backdrop-blur-sm border border-white/10">
            {channel.resolution}
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-1">
        <h3
          className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#FF9933] transition-colors line-clamp-1"
          title={channel.name}
        >
          {channel.name}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span className="truncate max-w-[65%] font-medium">{channel.group || 'General'}</span>
          <span className="text-[#FF9933] font-semibold text-[10px] uppercase shrink-0">
            {channel.language}
          </span>
        </div>
      </div>
    </div>
  );
};
