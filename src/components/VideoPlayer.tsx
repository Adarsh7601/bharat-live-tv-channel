import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  RotateCcw,
  PictureInPicture2,
  Scan,
  Radio,
  SkipBack,
  SkipForward,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  allChannels: Channel[];
  onBack: () => void;
  onSelectChannel: (channel: Channel) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  allChannels,
  onBack,
  onSelectChannel,
  isFavorite,
  onToggleFavorite,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectFit, setAspectFit] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUsingProxy, setIsUsingProxy] = useState(false);
  const [autoSwitchCountdown, setAutoSwitchCountdown] = useState<number | null>(null);
  const proxyAttemptedRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find index of current channel for previous / next navigation
  const currentIndex = allChannels.findIndex((c) => c.id === channel.id || c.url === channel.url);
  const prevChannel = currentIndex > 0 ? allChannels[currentIndex - 1] : null;
  const nextChannel = currentIndex < allChannels.length - 1 ? allChannels[currentIndex + 1] : null;

  // Best recommended working channel in the same genre or top verified stream
  const recommendedChannel =
    allChannels.find(
      (c) =>
        c.id !== channel.id &&
        c.url !== channel.url &&
        (c.group.toLowerCase() === channel.group.toLowerCase() ||
          c.name.toLowerCase().includes('dd sports') ||
          c.name.toLowerCase().includes('aaj tak') ||
          c.name.toLowerCase().includes('dd news') ||
          c.name.toLowerCase().includes('9xm'))
    ) || nextChannel || allChannels[0];

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [resetControlsTimer]);

  // Clean countdown on unmount or channel change
  useEffect(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setAutoSwitchCountdown(null);
  }, [channel.url]);

  // Load HLS Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorMessage(null);
    setIsBuffering(true);
    setIsPlaying(true);
    setIsUsingProxy(false);
    proxyAttemptedRef.current = false;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setAutoSwitchCountdown(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Determine initial stream URL:
    // If stream is plain http:// and page is on https://, route through stream-proxy to avoid mixed content block
    let streamUrl = channel.url;
    if (window.location.protocol === 'https:' && streamUrl.startsWith('http://')) {
      streamUrl = `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
      setIsUsingProxy(true);
      proxyAttemptedRef.current = true;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 12000,
        levelLoadingMaxRetry: 2,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 3,
        startFragPrefetch: true,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        setErrorMessage(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setAutoSwitchCountdown(null);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          if (data.details === 'bufferAppendNoProgress' || data.details === 'bufferStalledError') {
            if (video && !video.paused && video.readyState >= 2) {
              try {
                video.currentTime = video.currentTime + 0.05;
              } catch (_e) {}
            }
          }
          return;
        }

        // Fatal errors:
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;

          case Hls.ErrorTypes.NETWORK_ERROR:
          default:
            // Try proxy first if not yet tried
            if (!proxyAttemptedRef.current) {
              proxyAttemptedRef.current = true;
              setIsUsingProxy(true);
              const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(channel.url)}`;
              hls.loadSource(proxyUrl);
              hls.startLoad();
              return;
            }

            // If proxy also fails, start 3-second smart auto-switch
            setIsBuffering(false);
            setErrorMessage(
              `Broadcaster feed for ${channel.name} is currently offline. Auto-switching to working stream in 3s...`
            );

            let remaining = 3;
            setAutoSwitchCountdown(3);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
              remaining -= 1;
              if (remaining <= 0) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                if (recommendedChannel) {
                  onSelectChannel(recommendedChannel);
                }
              } else {
                setAutoSwitchCountdown(remaining);
              }
            }, 1000);
            break;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple Safari / iOS HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        if (!proxyAttemptedRef.current) {
          proxyAttemptedRef.current = true;
          setIsUsingProxy(true);
          video.src = `/api/stream-proxy?url=${encodeURIComponent(channel.url)}`;
          video.load();
        } else {
          setIsBuffering(false);
          setErrorMessage('Broadcaster stream currently inactive.');
          if (recommendedChannel) {
            onSelectChannel(recommendedChannel);
          }
        }
      });
    } else {
      setErrorMessage('HLS video streaming is not supported on this browser.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [channel.url]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error', err);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retryStream = (forceProxy = false) => {
    setErrorMessage(null);
    setIsBuffering(true);
    const useProxy = forceProxy || isUsingProxy;
    setIsUsingProxy(useProxy);
    proxyAttemptedRef.current = useProxy;
    const targetUrl = useProxy ? `/api/stream-proxy?url=${encodeURIComponent(channel.url)}` : channel.url;
    if (hlsRef.current) {
      hlsRef.current.loadSource(targetUrl);
      hlsRef.current.startLoad();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0F14] text-white">
      {/* Video & Player Container */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onTouchStart={resetControlsTimer}
        className={`relative w-full bg-black select-none overflow-hidden ${
          isFullscreen ? 'h-screen' : 'aspect-video max-h-[58vh]'
        }`}
      >
        <video
          ref={videoRef}
          className={`w-full h-full ${aspectFit ? 'object-contain' : 'object-cover'}`}
          playsInline
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
        />

        {/* Buffering Indicator */}
        {isBuffering && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-[#FF9933]/30 border-t-[#FF9933] animate-spin" />
            <p className="mt-3 text-xs tracking-wider font-medium text-amber-300 animate-pulse">
              CONNECTING LIVE STREAM...
            </p>
          </div>
        )}

        {/* Error Overlay with Smart Auto-Failover */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-20">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>

            <h3 className="text-base font-semibold text-white">
              {autoSwitchCountdown !== null
                ? `Auto-Switching to Live Feed (${autoSwitchCountdown}s)...`
                : 'Broadcaster Stream Offline'}
            </h3>

            <p className="text-xs text-gray-300 max-w-md mt-1 mb-4 leading-relaxed">
              This channel&apos;s remote server is temporarily inactive. Switching you to an active broadcast so you can keep watching.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {recommendedChannel && (
                <button
                  onClick={() => {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    onSelectChannel(recommendedChannel);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#FF7700] hover:from-[#ffaa4d] hover:to-[#ff881a] text-black font-extrabold text-xs shadow-lg shadow-[#FF9933]/25 transition hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Watch Live: {recommendedChannel.name.slice(0, 24)}
                </button>
              )}

              <button
                onClick={() => retryStream(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Proxy
              </button>

              {autoSwitchCountdown !== null && (
                <button
                  onClick={() => {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    setAutoSwitchCountdown(null);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition"
                >
                  Cancel Auto-Switch
                </button>
              )}
            </div>

            {/* Quick One-Tap Verified Channels */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 max-w-md">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider w-full mb-1">
                Verified 24x7 Live Streams:
              </span>
              {allChannels.slice(0, 4).map((c) => (
                <button
                  key={'alt-' + c.id}
                  onClick={() => {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    onSelectChannel(c);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-[11px] font-medium transition flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {c.name.slice(0, 16)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overlay Controls */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-3 sm:p-4 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={isFullscreen ? toggleFullscreen : onBack}
              className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
              {channel.logo && (
                <img
                  src={channel.logo}
                  alt=""
                  className="w-6 h-6 object-contain rounded bg-black/40 p-0.5"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              )}
              <div className="truncate">
                <h2 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-sm">
                  {channel.name}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-semibold text-red-400">LIVE</span>
                  <span>•</span>
                  <span>{channel.group || 'Indian TV'}</span>
                  <span>•</span>
                  <span className="text-[#FF9933]">{channel.language}</span>
                  {channel.resolution && (
                    <span className="px-1 py-0.2 rounded bg-white/20 text-[9px] font-mono">
                      {channel.resolution}
                    </span>
                  )}
                  {isUsingProxy && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-semibold border border-amber-500/40">
                      Proxy
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAspectFit(!aspectFit)}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  aspectFit ? 'bg-black/40 text-gray-300 hover:text-white' : 'bg-[#FF9933] text-black font-bold'
                }`}
                title={aspectFit ? 'Aspect Ratio: Fit (Click to Zoom)' : 'Aspect Ratio: Fill (Click to Fit)'}
              >
                <Scan className="w-4 h-4" />
              </button>
              <button
                onClick={togglePiP}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition"
                title="Picture in Picture"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Play/Pause and Quick Channel Switcher */}
          <div className="flex items-center justify-center gap-6">
            {prevChannel && (
              <button
                onClick={() => onSelectChannel(prevChannel)}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition hover:scale-110 active:scale-95"
                title={`Previous: ${prevChannel.name}`}
              >
                <SkipBack className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={togglePlay}
              className="p-4 sm:p-5 rounded-full bg-[#FF9933] hover:bg-[#ffaa4d] text-black shadow-lg shadow-[#FF9933]/30 transition hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black ml-0.5" />
              )}
            </button>

            {nextChannel && (
              <button
                onClick={() => onSelectChannel(nextChannel)}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition hover:scale-110 active:scale-95"
                title={`Next: ${nextChannel.name}`}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Live Indicator & Volume */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/90 text-white font-bold text-[11px] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-1 text-gray-200 hover:text-white transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 accent-[#FF9933] bg-white/20 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Fullscreen Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition active:scale-95"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Meta & Live Info Drawer (Visible when not in fullscreen) */}
      {!isFullscreen && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#161922] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#222634] flex items-center justify-center p-2 border border-white/5 shrink-0 overflow-hidden">
                {channel.logo ? (
                  <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Radio className="w-6 h-6 text-[#FF9933]" />
                )}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {channel.name}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Category: <span className="text-gray-200 font-medium">{channel.group}</span> •{' '}
                  Language: <span className="text-[#FF9933] font-medium">{channel.language}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    HLS Active
                  </span>
                  {channel.resolution && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {channel.resolution}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFavorite}
                className={`p-2.5 rounded-xl border transition ${
                  isFavorite
                    ? 'bg-[#FF9933]/15 border-[#FF9933] text-[#FF9933]'
                    : 'bg-[#222634] border-white/5 text-gray-400 hover:text-white'
                }`}
                title="Bookmark Channel"
              >
                ★
              </button>
            </div>
          </div>

          {/* Technical Info & Actions */}
          <div className="p-4 rounded-2xl bg-[#161922] border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">HLS Stream Source</span>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 text-xs text-[#FF9933] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Stream URL'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-[11px] text-gray-300 break-all border border-white/5">
              {channel.url}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
              <span>Media3 Protocol: HLS .m3u8</span>
              <a
                href={channel.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-gray-300 hover:text-white"
              >
                Direct Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Channel Bar */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              More Channels ({allChannels.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allChannels.slice(0, 6).map((c) => (
                <button
                  key={c.id + c.url}
                  onClick={() => onSelectChannel(c)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                    c.id === channel.id
                      ? 'bg-[#FF9933]/15 border-[#FF9933] text-white'
                      : 'bg-[#161922] border-white/5 text-gray-300 hover:bg-[#222634]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center shrink-0 p-1">
                    {c.logo ? (
                      <img src={c.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Radio className="w-3.5 h-3.5 text-[#FF9933]" />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
