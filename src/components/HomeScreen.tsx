import React from 'react';
import {
  Play,
  Flame,
  Radio,
  Newspaper,
  Music,
  Compass,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  Tv,
  Trophy,
} from 'lucide-react';
import { Channel } from '../types';

interface HomeScreenProps {
  channels: Channel[];
  favorites: string[];
  recentlyWatched: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onNavigateToChannels: (categoryFilter?: string) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  channels,
  favorites,
  recentlyWatched,
  onSelectChannel,
  onNavigateToChannels,
  onToggleFavorite,
}) => {
  // Find a strong featured channel (e.g. Aaj Tak, DD News, DD Sports, or 9XM)
  const featuredChannel =
    channels.find(
      (c) =>
        c.name.toLowerCase().includes('dd sports') ||
        c.name.toLowerCase().includes('aaj tak') ||
        c.name.toLowerCase().includes('dd news') ||
        c.name.toLowerCase().includes('9xm')
    ) || channels[0];

  // Helper to deduplicate channels by id or url
  const dedupeChannels = (list: Channel[]) => {
    const seen = new Set<string>();
    return list.filter((ch) => {
      const key = `${ch.id || ch.name}-${ch.url}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Curate Sports Channels
  const rawSportsChannels = channels.filter(
    (c) =>
      c.group.toLowerCase().includes('sport') ||
      c.name.toLowerCase().includes('sport') ||
      c.name.toLowerCase().includes('cricket') ||
      c.name.toLowerCase().includes('football') ||
      c.name.toLowerCase().includes('kabaddi') ||
      c.name.toLowerCase().includes('wrestling')
  );

  // If no sports found in dynamic playlist, provide verified Indian sports channels
  const activeSportsChannels: Channel[] = dedupeChannels(
    rawSportsChannels.length > 0
      ? rawSportsChannels
      : [
          {
            id: 'dd-sports-hd',
            name: 'DD Sports HD',
            logo: 'https://dtil.tmsimg.com/assets/s158255_ld_h15_aa.png?lock=720x540',
            url: 'https://mumbai-edge.smartplaytv.in/DDSportsHD/index.m3u8',
            group: 'Sports',
            language: 'Hindi',
            country: 'IN',
            resolution: '720p HD',
          },
          {
            id: 'dd-sports-sd',
            name: 'DD Sports SD',
            logo: 'https://dtil.tmsimg.com/assets/s158255_ld_h15_aa.png?lock=720x540',
            url: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/b17adfe543354fdd8d189b110617cddd/index.m3u8',
            group: 'Sports',
            language: 'Hindi',
            country: 'IN',
            resolution: '1080p FHD',
          },
        ]
  );

  // Curate News Channels
  const newsChannels = dedupeChannels(
    channels.filter(
      (c) =>
        c.group.toLowerCase().includes('news') ||
        c.name.toLowerCase().includes('news') ||
        c.name.toLowerCase().includes('aaj tak') ||
        c.name.toLowerCase().includes('abp') ||
        c.name.toLowerCase().includes('dd ')
    )
  ).slice(0, 10);

  // Curate Music Channels
  const musicChannels = dedupeChannels(
    channels.filter(
      (c) =>
        c.group.toLowerCase().includes('music') ||
        c.name.toLowerCase().includes('music') ||
        c.name.toLowerCase().includes('9x') ||
        c.name.toLowerCase().includes('jalwa')
    )
  ).slice(0, 10);

  // Curate Devotional Channels
  const devotionalChannels = dedupeChannels(
    channels.filter(
      (c) =>
        c.group.toLowerCase().includes('devotional') ||
        c.group.toLowerCase().includes('religious') ||
        c.name.toLowerCase().includes('bhakti') ||
        c.name.toLowerCase().includes('satsang') ||
        c.name.toLowerCase().includes('peace')
    )
  ).slice(0, 10);

  const cleanRecentlyWatched = dedupeChannels(recentlyWatched);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pb-12 select-none">
      {/* Hero Featured Channel Showcase */}
      {featuredChannel && (
        <div className="relative mx-4 sm:mx-6 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E2230] via-[#161922] to-[#0F1117] border border-white/10 shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#FF9933]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              {/* Badge row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold tracking-wider shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  FEATURED LIVE BROADCAST
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30 text-xs font-semibold">
                  {featuredChannel.language || 'National'}
                </span>
                {featuredChannel.resolution && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-200 text-xs font-mono">
                    {featuredChannel.resolution}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {featuredChannel.name}
              </h1>

              <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                Watch 24x7 non-stop Indian television live streaming with high-definition audio and
                adaptive bitrate video directly via native HLS.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => onSelectChannel(featuredChannel)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9933] to-[#FF7700] hover:from-[#ffaa4d] hover:to-[#ff881a] text-black font-extrabold text-sm shadow-lg shadow-[#FF9933]/25 transition hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Stream Now
                </button>
                <button
                  onClick={() => onNavigateToChannels('Sports')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-md transition active:scale-95"
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Live Sports
                </button>
              </div>
            </div>

            {/* Logo Card */}
            <div
              className="w-32 h-32 sm:w-44 sm:h-44 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center p-4 shrink-0 shadow-inner group cursor-pointer hover:border-[#FF9933]/50 transition"
              onClick={() => onSelectChannel(featuredChannel)}
            >
              {featuredChannel.logo ? (
                <img
                  src={featuredChannel.logo}
                  alt={featuredChannel.name}
                  className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition duration-300"
                />
              ) : (
                <Radio className="w-16 h-16 text-[#FF9933]" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Category Shortcuts */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigateToChannels('Sports')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 hover:border-emerald-500/40 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                Live Sports
              </div>
              <div className="text-[10px] text-gray-400">Cricket &amp; Matches</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToChannels('News')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 hover:border-red-500/40 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-red-400 transition">
                News &amp; National
              </div>
              <div className="text-[10px] text-gray-400">{newsChannels.length} Channels</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToChannels('Music')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 hover:border-amber-500/40 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                Music &amp; Hits
              </div>
              <div className="text-[10px] text-gray-400">{musicChannels.length} Channels</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToChannels('Entertainment')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 hover:border-purple-500/40 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-400 transition">
                Entertainment
              </div>
              <div className="text-[10px] text-gray-400">TV Shows &amp; Movies</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToChannels('Favorites')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 hover:border-[#FF9933]/40 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933] group-hover:scale-110 transition">
              <Star className="w-5 h-5 fill-[#FF9933]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#FF9933] transition">
                My Favorites
              </div>
              <div className="text-[10px] text-gray-400">{favorites.length} Saved</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recently Watched (if any) */}
      {cleanRecentlyWatched.length > 0 && (
        <section className="px-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF9933]" />
              Recently Watched
            </h2>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {cleanRecentlyWatched.map((channel, idx) => (
              <div
                key={`recent-${channel.id}-${channel.url}-${idx}`}
                onClick={() => onSelectChannel(channel)}
                className="w-36 sm:w-44 shrink-0 rounded-2xl bg-[#161922] hover:bg-[#1f2330] border border-white/5 p-3 cursor-pointer group transition duration-200"
              >
                <div className="w-full h-20 rounded-xl bg-black/40 flex items-center justify-center p-2 mb-2 relative overflow-hidden">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Radio className="w-8 h-8 text-[#FF9933]" />
                  )}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[8px] font-bold">
                    LIVE
                  </div>
                </div>
                <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF9933] transition">
                  {channel.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{channel.group}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: 🏆 Live Sports & Cricket (Dedicated Sports Section) */}
      <section className="px-4 sm:px-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Live Sports &amp; Cricket Action
              </h2>
              <p className="text-[11px] text-gray-400">
                DD Sports, Tournaments &amp; National Games
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToChannels('Sports')}
            className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline"
          >
            View Sports <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2">
          {activeSportsChannels.map((channel, idx) => (
            <div
              key={`sports-${channel.id}-${channel.url}-${idx}`}
              onClick={() => onSelectChannel(channel)}
              className="w-44 sm:w-52 shrink-0 rounded-2xl bg-gradient-to-b from-[#18231E] to-[#141A17] hover:from-[#1E2E27] hover:to-[#17201C] border border-emerald-500/20 hover:border-emerald-500/50 p-3.5 cursor-pointer group transition duration-200 shadow-lg shadow-emerald-950/20"
            >
              <div className="w-full h-24 rounded-xl bg-[#0D1511] flex items-center justify-center p-2.5 mb-2.5 relative border border-emerald-500/10">
                {channel.logo ? (
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition"
                  />
                ) : (
                  <Trophy className="w-10 h-10 text-emerald-400" />
                )}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold">
                  LIVE MATCH
                </span>
                {channel.resolution && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-emerald-300 text-[8px] font-mono border border-emerald-500/20">
                    {channel.resolution}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">
                {channel.name}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                <span className="text-emerald-400/90 font-medium">Sports / Live</span>
                <span className="text-[#FF9933] font-semibold">{channel.language}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Row 1: Breaking News & Current Affairs */}
      {newsChannels.length > 0 && (
        <section className="px-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              Live News &amp; Updates
            </h2>
            <button
              onClick={() => onNavigateToChannels('News')}
              className="flex items-center gap-1 text-xs text-[#FF9933] font-semibold hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2">
            {newsChannels.map((channel, idx) => (
              <div
                key={`news-${channel.id}-${channel.url}-${idx}`}
                onClick={() => onSelectChannel(channel)}
                className="w-40 sm:w-48 shrink-0 rounded-2xl bg-[#161922] hover:bg-[#1d212d] border border-white/5 hover:border-red-500/40 p-3 cursor-pointer group transition duration-200 shadow-md"
              >
                <div className="w-full h-24 rounded-xl bg-[#222634]/60 flex items-center justify-center p-2.5 mb-2 relative">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition"
                    />
                  ) : (
                    <Radio className="w-8 h-8 text-red-400" />
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-bold">
                    LIVE
                  </span>
                  {channel.resolution && (
                    <span className="absolute bottom-2 right-2 px-1 py-0.2 rounded bg-black/60 text-white text-[8px] font-mono">
                      {channel.resolution}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                  {channel.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                  <span className="truncate">{channel.group}</span>
                  <span className="text-[#FF9933] font-semibold">{channel.language}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Row 2: Non-Stop Music & Hits */}
      {musicChannels.length > 0 && (
        <section className="px-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              Music, Bollywood &amp; Hits
            </h2>
            <button
              onClick={() => onNavigateToChannels('Music')}
              className="flex items-center gap-1 text-xs text-[#FF9933] font-semibold hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2">
            {musicChannels.map((channel, idx) => (
              <div
                key={`music-${channel.id}-${channel.url}-${idx}`}
                onClick={() => onSelectChannel(channel)}
                className="w-40 sm:w-48 shrink-0 rounded-2xl bg-[#161922] hover:bg-[#1d212d] border border-white/5 hover:border-amber-500/40 p-3 cursor-pointer group transition duration-200 shadow-md"
              >
                <div className="w-full h-24 rounded-xl bg-[#222634]/60 flex items-center justify-center p-2.5 mb-2 relative">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition"
                    />
                  ) : (
                    <Music className="w-8 h-8 text-amber-400" />
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-bold">
                    LIVE
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition">
                  {channel.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                  <span className="truncate">{channel.group}</span>
                  <span className="text-[#FF9933] font-semibold">{channel.language}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Row 3: Devotional & Cultural */}
      {devotionalChannels.length > 0 && (
        <section className="px-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF9933]" />
              Devotional &amp; Spiritual
            </h2>
            <button
              onClick={() => onNavigateToChannels('Devotional')}
              className="flex items-center gap-1 text-xs text-[#FF9933] font-semibold hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2">
            {devotionalChannels.map((channel, idx) => (
              <div
                key={`devotional-${channel.id}-${channel.url}-${idx}`}
                onClick={() => onSelectChannel(channel)}
                className="w-40 sm:w-48 shrink-0 rounded-2xl bg-[#161922] hover:bg-[#1d212d] border border-white/5 hover:border-[#FF9933]/40 p-3 cursor-pointer group transition duration-200 shadow-md"
              >
                <div className="w-full h-24 rounded-xl bg-[#222634]/60 flex items-center justify-center p-2.5 mb-2 relative">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition"
                    />
                  ) : (
                    <Radio className="w-8 h-8 text-[#FF9933]" />
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-bold">
                    LIVE
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate group-hover:text-[#FF9933] transition">
                  {channel.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                  <span className="truncate">{channel.group}</span>
                  <span className="text-[#FF9933] font-semibold">{channel.language}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Free Public Broadcast Info Banner */}
      <div className="mx-4 sm:mx-6 p-4 rounded-2xl bg-[#161922] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white">100% Free &amp; Open Public Channels</div>
            <div className="text-[11px] text-gray-400">
              Aggregated from open-source IPTV-org repository with no paywalls or user logins.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateToChannels()}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs whitespace-nowrap"
        >
          Explore All Channels
        </button>
      </div>
    </div>
  );
};
