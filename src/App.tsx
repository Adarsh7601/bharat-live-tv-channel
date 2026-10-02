import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  Search,
  RefreshCw,
  Star,
  Smartphone,
  Code2,
  X,
  Radio,
  Globe,
  Monitor,
  Home,
  Compass,
  Sparkles,
  Wifi,
  Battery,
  Flame,
} from 'lucide-react';
import { Channel, PlaylistSourceType } from './types';
import { ChannelCard } from './components/ChannelCard';
import { VideoPlayer } from './components/VideoPlayer';
import { AndroidCodeViewer } from './components/AndroidCodeViewer';
import { HomeScreen } from './components/HomeScreen';

export type AppPage = 'home' | 'channels' | 'favorites';

export default function App() {
  const [activeSource, setActiveSource] = useState<PlaylistSourceType>('in');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bharat_tv_favorites');
      return saved ? JSON.parse(saved) : ['dd-news', 'aaj-tak', '9xm'];
    } catch {
      return ['dd-news', 'aaj-tak', '9xm'];
    }
  });

  const [recentlyWatched, setRecentlyWatched] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('bharat_tv_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<'app' | 'code'>('app');
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(false);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bharat_tv_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites', e);
    }
  }, [favorites]);

  // Save recently watched to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bharat_tv_recent', JSON.stringify(recentlyWatched));
    } catch (e) {
      console.warn('Could not save recently watched', e);
    }
  }, [recentlyWatched]);

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setRecentlyWatched((prev) => {
      const filtered = prev.filter((c) => c.id !== channel.id && c.url !== channel.url);
      return [channel, ...filtered].slice(0, 10);
    });
  };

  // Fetch channels from backend API
  const fetchChannels = async (sourceKey: PlaylistSourceType, customEndpoint?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let url = `/api/channels?source=${sourceKey}`;
      if (sourceKey === 'custom' && customEndpoint) {
        url += `&customUrl=${encodeURIComponent(customEndpoint)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.channels && data.channels.length > 0) {
        setChannels(data.channels);
      } else {
        throw new Error('No channels returned in playlist.');
      }
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setErrorMessage(err.message || 'Failed to load Indian TV channels.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels(activeSource);
  }, [activeSource]);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    channels.forEach((c) => {
      if (c.group && c.group.trim()) {
        list.add(c.group.trim());
      }
    });
    return Array.from(list).sort();
  }, [channels]);

  // Filter channels based on Search, Category, and Favorites Page
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        channel.name.toLowerCase().includes(q) ||
        channel.group.toLowerCase().includes(q) ||
        channel.language.toLowerCase().includes(q);

      const isFavoritesPage = currentPage === 'favorites';
      if (isFavoritesPage && !favorites.includes(channel.id)) {
        return false;
      }

      const matchesCategory =
        selectedCategory === 'All' || isFavoritesPage
          ? true
          : selectedCategory === 'Favorites'
          ? favorites.includes(channel.id)
          : channel.group.toLowerCase() === selectedCategory.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [channels, searchQuery, selectedCategory, favorites, currentPage]);

  // Content for the Streamer view
  const renderStreamerContent = () => {
    if (selectedChannel) {
      return (
        <VideoPlayer
          channel={selectedChannel}
          allChannels={filteredChannels.length > 0 ? filteredChannels : channels}
          onBack={() => setSelectedChannel(null)}
          onSelectChannel={handleSelectChannel}
          isFavorite={favorites.includes(selectedChannel.id)}
          onToggleFavorite={() => toggleFavorite(selectedChannel.id)}
        />
      );
    }

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top App Bar (Native Android Material 3 Header) */}
        <header className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/5 bg-[#12141C] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9933] to-[#FF7700] flex items-center justify-center text-black shadow-md shadow-[#FF9933]/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">BharatTV Live</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Free Indian Television & HLS Streaming</p>
            </div>
          </div>

          {/* Source Dropdown & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={activeSource}
                onChange={(e) => {
                  const val = e.target.value as PlaylistSourceType;
                  if (val === 'custom') {
                    setShowCustomModal(true);
                  } else {
                    setActiveSource(val);
                  }
                }}
                className="appearance-none bg-[#1C202C] text-xs font-semibold text-gray-200 border border-white/10 rounded-xl px-3 py-1.5 pr-8 hover:border-[#FF9933]/50 focus:outline-none focus:ring-1 focus:ring-[#FF9933] cursor-pointer"
              >
                <option value="in">All India (in.m3u)</option>
                <option value="hin">Hindi Channels (hin.m3u)</option>
                <option value="custom">Custom M3U URL...</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-[#FF9933] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchChannels(activeSource, customUrl)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#1C202C] hover:bg-[#252a3a] text-gray-300 hover:text-white border border-white/5 transition active:scale-95 disabled:opacity-50"
              title="Refresh Channels"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF9933]' : ''}`} />
            </button>
          </div>
        </header>

        {/* Page Switcher Navigation Pills (Desktop & Tablet view) */}
        <div className="px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between border-b border-white/5 bg-[#0F1117] shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentPage('home');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                currentPage === 'home'
                  ? 'bg-[#FF9933] text-black shadow-sm shadow-[#FF9933]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setCurrentPage('channels');
                setSelectedCategory('All');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                currentPage === 'channels'
                  ? 'bg-[#FF9933] text-black shadow-sm shadow-[#FF9933]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Channels</span>
            </button>

            <button
              onClick={() => setCurrentPage('favorites')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                currentPage === 'favorites'
                  ? 'bg-[#FF9933] text-black shadow-sm shadow-[#FF9933]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${currentPage === 'favorites' ? 'fill-black' : 'text-[#FF9933]'}`}
              />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-400 font-medium hidden sm:block">
            {channels.length} Live Channels Available
          </div>
        </div>

        {/* Dynamic Page Content */}
        {currentPage === 'home' ? (
          <HomeScreen
            channels={channels}
            favorites={favorites}
            recentlyWatched={recentlyWatched}
            onSelectChannel={handleSelectChannel}
            onNavigateToChannels={(category) => {
              setCurrentPage('channels');
              if (category) setSelectedCategory(category);
            }}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar & Category Filter Bar */}
            <div className="p-4 sm:px-6 pb-2 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    currentPage === 'favorites'
                      ? 'Search your favorite channels...'
                      : 'Search Indian channels (e.g. DD News, Aaj Tak, 9XM, ABP)...'
                  }
                  className="w-full bg-[#161922] text-sm text-white placeholder-gray-500 rounded-xl pl-10 pr-9 py-2.5 border border-white/5 focus:border-[#FF9933] focus:outline-none focus:ring-1 focus:ring-[#FF9933] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Chips (Only on Channels page) */}
              {currentPage === 'channels' && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
                      selectedCategory === 'All'
                        ? 'bg-[#FF9933] text-black shadow-sm'
                        : 'bg-[#1C202C] text-gray-300 hover:bg-[#252a3a]'
                    }`}
                  >
                    All ({channels.length})
                  </button>

                  <button
                    onClick={() => setSelectedCategory('Favorites')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
                      selectedCategory === 'Favorites'
                        ? 'bg-[#FF9933] text-black shadow-sm'
                        : 'bg-[#1C202C] text-gray-300 hover:bg-[#252a3a]'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${selectedCategory === 'Favorites' ? 'fill-black' : 'text-[#FF9933]'}`}
                    />
                    Favorites ({favorites.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition ${
                        selectedCategory === cat
                          ? 'bg-[#FF9933] text-black font-semibold'
                          : 'bg-[#1C202C] text-gray-300 hover:bg-[#252a3a]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Channels Grid */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full border-3 border-[#FF9933]/30 border-t-[#FF9933] animate-spin mb-3" />
                  <p className="text-sm font-semibold text-gray-300">Fetching Indian TV Playlists...</p>
                  <p className="text-xs text-gray-500 mt-1">Parsing IPTV-org M3U stream metadata</p>
                </div>
              ) : errorMessage ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#161922] rounded-2xl border border-white/5 my-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Error Loading Playlist</h3>
                  <p className="text-xs text-gray-400 max-w-sm mt-1 mb-4">{errorMessage}</p>
                  <button
                    onClick={() => fetchChannels(activeSource, customUrl)}
                    className="px-4 py-2 rounded-xl bg-[#FF9933] text-black font-semibold text-xs transition"
                  >
                    Retry Request
                  </button>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#161922] rounded-2xl border border-white/5 my-4">
                  {currentPage === 'favorites' ? (
                    <>
                      <Star className="w-10 h-10 text-gray-500 mb-2" />
                      <h3 className="text-sm font-semibold text-white">No Favorite Channels Yet</h3>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs">
                        Tap the star icon on any channel card to save it here for instant one-touch access.
                      </p>
                      <button
                        onClick={() => setCurrentPage('channels')}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#FF9933] text-black font-bold text-xs"
                      >
                        Explore Channels
                      </button>
                    </>
                  ) : (
                    <>
                      <Tv className="w-10 h-10 text-gray-500 mb-2" />
                      <h3 className="text-sm font-semibold text-white">No channels found</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search query &quot;{searchQuery}&quot; or select a different category.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3 px-1">
                    <span>
                      Showing <strong className="text-white">{filteredChannels.length}</strong>{' '}
                      {currentPage === 'favorites' ? 'favorite' : ''} channels
                    </span>
                    <span className="text-[11px] text-[#FF9933]">Tap any channel to stream live</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {filteredChannels.map((channel, idx) => (
                      <ChannelCard
                        key={`grid-${channel.id}-${channel.url}-${idx}`}
                        channel={channel}
                        isFavorite={favorites.includes(channel.id)}
                        onFavoriteClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(channel.id);
                        }}
                        onClick={() => handleSelectChannel(channel)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Native Android Bottom Navigation Bar (Visible in phone frame or on small viewports) */}
        <nav className="h-14 border-t border-white/5 bg-[#12141C] flex items-center justify-around px-2 shrink-0 md:hidden">
          <button
            onClick={() => {
              setCurrentPage('home');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentPage === 'home' ? 'text-[#FF9933]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button
            onClick={() => {
              setCurrentPage('channels');
              setSelectedCategory('All');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentPage === 'channels' ? 'text-[#FF9933]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-bold">Channels</span>
          </button>

          <button
            onClick={() => setCurrentPage('favorites')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentPage === 'favorites' ? 'text-[#FF9933]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Star
              className={`w-5 h-5 ${currentPage === 'favorites' ? 'fill-[#FF9933]' : ''}`}
            />
            <span className="text-[10px] font-bold">Favorites</span>
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-gray-100 flex flex-col">
      {/* Global Top Navbar */}
      <nav className="h-14 border-b border-white/5 bg-[#0D0F14] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] shadow-sm shadow-[#FF9933]" />
            <h1 className="font-bold text-sm sm:text-base text-white tracking-wide">
              BharatTV Live{' '}
              <span className="text-xs font-normal text-gray-400 hidden sm:inline">
                | Indian TV Streamer
              </span>
            </h1>
          </div>
        </div>

        {/* View Mode Tabs & Frame Toggle */}
        <div className="flex items-center gap-2">
          {/* Streamer App vs Android Code Tabs */}
          <div className="flex items-center bg-[#1A1D27] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'app'
                  ? 'bg-[#FF9933] text-black shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live Streamer</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'code'
                  ? 'bg-[#FF9933] text-black shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Native Android Code</span>
            </button>
          </div>

          {/* Toggle Phone Device Frame in Live Streamer mode */}
          {activeTab === 'app' && (
            <button
              onClick={() => setDeviceFrameMode(!deviceFrameMode)}
              className={`p-2 rounded-xl border transition ${
                deviceFrameMode
                  ? 'bg-[#FF9933]/15 border-[#FF9933] text-[#FF9933]'
                  : 'bg-[#1A1D27] border-white/5 text-gray-400 hover:text-white'
              }`}
              title={deviceFrameMode ? 'Switch to Widescreen' : 'Switch to Android Phone Frame'}
            >
              {deviceFrameMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}
        </div>
      </nav>

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'code' ? (
          <div className="flex-1 w-full h-full">
            <AndroidCodeViewer />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-0 md:p-3 overflow-hidden bg-[#0A0C10]">
            {deviceFrameMode ? (
              /* Realistic Android Phone Device Frame (Pixel 9 style) */
              <div className="relative w-full max-w-[420px] h-[95vh] max-h-[880px] bg-[#161922] rounded-[48px] p-3 shadow-2xl shadow-black/80 border-4 border-[#282D3D] flex flex-col overflow-hidden ring-1 ring-white/10">
                {/* Android Phone Top Status Bar */}
                <div className="h-7 px-6 flex items-center justify-between text-[11px] text-gray-400 font-medium select-none shrink-0 bg-[#12141C]">
                  <span>10:30</span>
                  {/* Camera Punch Hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-gray-300" />
                    <Battery className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>

                {/* Inner Android App Container */}
                <div className="flex-1 overflow-hidden bg-[#0D0F14] rounded-b-[36px] flex flex-col">
                  {renderStreamerContent()}
                </div>

                {/* Android Gesture Bar */}
                <div className="h-4 flex items-center justify-center shrink-0 bg-[#0D0F14] rounded-b-[40px]">
                  <div className="w-32 h-1 bg-white/20 rounded-full" />
                </div>
              </div>
            ) : (
              /* Widescreen Full-Width Mode */
              <div className="flex-1 h-full w-full bg-[#0D0F14] overflow-hidden flex flex-col">
                {renderStreamerContent()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom M3U Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161922] rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FF9933]" />
                Load Custom IPTV M3U Playlist
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Enter any public M3U playlist URL to parse and stream live channels natively.
            </p>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/playlist.m3u"
              className="w-full bg-[#0D0F14] text-xs text-white rounded-xl p-3 border border-white/10 focus:border-[#FF9933] focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customUrl.trim()) {
                    setActiveSource('custom');
                    fetchChannels('custom', customUrl.trim());
                    setShowCustomModal(false);
                  }
                }}
                disabled={!customUrl.trim()}
                className="px-4 py-2 rounded-xl bg-[#FF9933] text-black font-bold disabled:opacity-50"
              >
                Load Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
