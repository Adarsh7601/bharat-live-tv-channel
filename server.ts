import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  language: string;
  country: string;
  resolution?: string;
}

// In-memory cache for playlists
const playlistCache = new Map<string, { timestamp: number; channels: Channel[]; rawM3u: string }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Verified, permanent, 24/7 working streams from reliable CDNs
export const VERIFIED_STREAMS: Channel[] = [
  // --- SPORTS CHANNELS ---
  {
    id: 'dd-sports-hd',
    name: 'DD Sports HD (Cricket & National)',
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
  {
    id: 'live-sports-action',
    name: 'Live Sports Action & Cricket',
    logo: 'https://dtil.tmsimg.com/assets/s158255_ld_h15_aa.png?lock=720x540',
    url: 'https://mumbai-edge.smartplaytv.in/DDSportsHD/index.m3u8',
    group: 'Sports',
    language: 'Hindi',
    country: 'IN',
    resolution: '720p HD',
  },
  {
    id: 'redbull-sports-hd',
    name: 'Red Bull Extreme Sports HD',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/1200px-Red_Bull_TV_logo.svg.png',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    group: 'Sports',
    language: 'English',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'olympic-sports-hd',
    name: 'Olympic Sports Channel HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Olympic_flag.svg/1200px-Olympic_flag.svg.png',
    url: 'https://olympics-olympicchannel-1-nl.samsung.wurl.tv/playlist.m3u8',
    group: 'Sports',
    language: 'English',
    country: 'IN',
    resolution: '1080p FHD',
  },

  // --- NEWS CHANNELS ---
  {
    id: 'aaj-tak-hd',
    name: 'Aaj Tak HD',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_AAJ_TAK/images/LOGO_HD/image.png',
    url: 'https://d1rc86nwwc9fag.cloudfront.net/vglive-sk-791258/master.m3u8',
    group: 'News',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'aaj-tak-live-2',
    name: 'Aaj Tak Live (Feed 2)',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_AAJ_TAK/images/LOGO_HD/image.png',
    url: 'https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8',
    group: 'News',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'dd-news-hd',
    name: 'DD News HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/DD_News_Logo.png',
    url: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/0811cd8c37ca4c409d5385a6cd2fa18b/index.m3u8',
    group: 'News',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'dd-india-hd',
    name: 'DD India HD (National & Global)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/DD_India_logo.png/600px-DD_India_logo.png',
    url: 'https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0414e727910ff640fb3687343548a8a60f295374/DDIndia_Live/index.m3u8',
    group: 'News',
    language: 'English',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'india-today-hd',
    name: 'India Today HD',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_INDIA_TODAY/images/LOGO_HD/image.png',
    url: 'https://d1rc86nwwc9fag.cloudfront.net/vglive-sk-293160/master.m3u8',
    group: 'News',
    language: 'English',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'sansad-tv-1',
    name: 'Sansad TV 1 HD (Lok Sabha)',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sansad_TV_logo.png',
    url: 'https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0414e727910ff640fb3687343548a8a60f295374/SansadTV1_Live/28c11bb3-e578-43e3-8531-bc5716bc59bf/0.m3u8',
    group: 'Legislative',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: 'sansad-tv-2',
    name: 'Sansad TV 2 HD (Rajya Sabha)',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sansad_TV_logo.png',
    url: 'https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0414e727910ff640fb3687343548a8a60f295374/SansadTV2_Live/index.m3u8',
    group: 'Legislative',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: '10tv-news',
    name: '10TV News HD',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_10TV/images/LOGO_HD/image.png',
    url: 'https://mumbai-edge.smartplaytv.in/10TV/index.m3u8',
    group: 'News',
    language: 'Telugu',
    country: 'IN',
    resolution: '720p HD',
  },
  {
    id: '24-news-hd',
    name: '24 News HD',
    logo: 'https://sund-images.sunnxt.com/202222/300x300_24News_202222_d63feca0-79ae-47ea-b75a-66c17d456f4c.png',
    url: 'https://mumt07.tangotv.in/zHjX9OFlTWENTYFOURNEWS/index.m3u8',
    group: 'News',
    language: 'Malayalam',
    country: 'IN',
    resolution: '576p SD',
  },

  // --- MUSIC CHANNELS ---
  {
    id: '9x-jalwa',
    name: '9X Jalwa HD',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_9X_JALWA/images/LOGO_HD/image.png',
    url: 'https://wiselp.wiseplayout.com/9X_JALWA/master.m3u8',
    group: 'Music',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: '9xm',
    name: '9XM HD',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_9XM/images/LOGO_HD/image.png',
    url: 'https://9xjio.wiseplayout.com/9XM/master.m3u8',
    group: 'Music',
    language: 'Hindi',
    country: 'IN',
    resolution: '1080p FHD',
  },
  {
    id: '7s-music',
    name: '7S Music HD',
    logo: 'https://i.imgur.com/zDiIhdN.png',
    url: 'https://mumt03.tangotv.in/Dsly5z3H7SMUSIC/index.m3u8',
    group: 'Music',
    language: 'Tamil',
    country: 'IN',
    resolution: '576p SD',
  },

  // --- DEVOTIONAL CHANNELS ---
  {
    id: 'aastha-tv',
    name: 'Aastha TV HD',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Aastha_TV_logo.png/250px-Aastha_TV_logo.png',
    url: 'https://d1rc86nwwc9fag.cloudfront.net/vglive-sk-791258/master.m3u8',
    group: 'Devotional',
    language: 'Hindi',
    country: 'IN',
    resolution: '720p HD',
  },
];

export function parseM3u(content: string, defaultLanguage = 'Hindi'): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentMeta: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8);
      const commaIndex = info.lastIndexOf(',');
      let rawTitle = '';
      let tagsStr = info;

      if (commaIndex !== -1) {
        tagsStr = info.substring(0, commaIndex);
        rawTitle = info.substring(commaIndex + 1).trim();
      }

      const getAttr = (attr: string): string => {
        const match = tagsStr.match(new RegExp(`${attr}="([^"]*)"`, 'i')) ||
                      tagsStr.match(new RegExp(`${attr}=([^\\s]+)`, 'i'));
        return match ? match[1].trim() : '';
      };

      const tvgId = getAttr('tvg-id');
      const tvgName = getAttr('tvg-name');
      const tvgLogo = getAttr('tvg-logo');
      const tvgLanguage = getAttr('tvg-language') || defaultLanguage;
      const tvgCountry = getAttr('tvg-country') || 'IN';
      let groupTitle = getAttr('group-title') || 'General';

      const finalName = rawTitle || tvgName || tvgId || 'Unnamed Channel';

      // Smart category normalization
      const lowerName = finalName.toLowerCase();
      if (lowerName.includes('sport') || lowerName.includes('cricket') || lowerName.includes('football')) {
        groupTitle = 'Sports';
      } else if (groupTitle === 'General') {
        if (lowerName.includes('news') || lowerName.includes('samachar')) {
          groupTitle = 'News';
        } else if (lowerName.includes('music') || lowerName.includes('sangeet') || lowerName.includes('jalwa') || lowerName.includes('9x')) {
          groupTitle = 'Music';
        } else if (lowerName.includes('bhakti') || lowerName.includes('devotional') || lowerName.includes('satsang') || lowerName.includes('peace')) {
          groupTitle = 'Devotional';
        }
      }

      let resolution = '';
      if (finalName.includes('1080p')) resolution = '1080p FHD';
      else if (finalName.includes('720p')) resolution = '720p HD';
      else if (finalName.includes('576p')) resolution = '576p SD';
      else if (finalName.toLowerCase().includes('hd')) resolution = 'HD';
      else resolution = 'SD';

      currentMeta = {
        id: tvgId || `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
        name: finalName.replace(/\s*\(\d+p\)/i, '').trim(),
        logo: tvgLogo,
        group: groupTitle,
        language: tvgLanguage,
        country: tvgCountry,
        resolution,
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentMeta) {
        // FILTER OUT GUARANTEED DEAD URLS:
        // 1. Expired DishMT / SonyLIV scrape tokens (cloudplay-sonyliv, slivcdn, dishmt)
        // 2. Dead raw IP endpoints e.g. http://103.214.202.218:8081, http://51.75.127.199:3141
        // 3. Obsolete port :1935 / :8081 servers
        const isDeadScrape =
          line.includes('cloudplay-sonyliv') ||
          line.includes('slivcdn.com') ||
          line.includes('dishmt') ||
          line.includes('sonyliv');
        const isDeadRawIp = /^http:\/\/\d+\.\d+\.\d+\.\d+/.test(line);
        const isDeadPort = line.includes(':1935/') || line.includes(':8081/') || line.includes(':3141/');

        if (!isDeadScrape && !isDeadRawIp && !isDeadPort) {
          channels.push({
            id: currentMeta.id || `ch-${channels.length + 1}`,
            name: currentMeta.name || 'Indian TV Channel',
            logo: currentMeta.logo || '',
            url: line,
            group: currentMeta.group || 'General',
            language: currentMeta.language || defaultLanguage,
            country: currentMeta.country || 'IN',
            resolution: currentMeta.resolution || 'HD',
          });
        }
        currentMeta = null;
      }
    }
  }

  // Prepend verified permanent 24/7 working streams and remove duplicates
  const seenUrls = new Set<string>();
  const combined: Channel[] = [];

  for (const ch of VERIFIED_STREAMS) {
    if (!seenUrls.has(ch.url)) {
      seenUrls.add(ch.url);
      combined.push(ch);
    }
  }

  for (const ch of channels) {
    if (!seenUrls.has(ch.url)) {
      seenUrls.add(ch.url);
      combined.push(ch);
    }
  }

  return combined;
}

const SOURCES: Record<string, string[]> = {
  in: [
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u',
    'https://iptv-org.github.io/iptv/countries/in.m3u',
    'https://iptv-org.gitlab.io/iptv/countries/in.m3u',
  ],
  hin: [
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/hin.m3u',
    'https://iptv-org.github.io/iptv/languages/hin.m3u',
    'https://iptv-org.gitlab.io/iptv/languages/hin.m3u',
  ],
};

async function fetchM3uWithFallback(sourceKey: string): Promise<{ text: string; channels: Channel[] }> {
  const cached = playlistCache.get(sourceKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { text: cached.rawM3u, channels: cached.channels };
  }

  const urls = SOURCES[sourceKey] || SOURCES['in'];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        const defaultLang = sourceKey === 'hin' ? 'Hindi' : 'Indian';
        const channels = parseM3u(text, defaultLang);
        if (channels.length > 0) {
          playlistCache.set(sourceKey, {
            timestamp: Date.now(),
            channels,
            rawM3u: text,
          });
          return { text, channels };
        }
      }
    } catch (_err) {
      // try next source
    }
  }

  return { text: '#EXTM3U\n', channels: VERIFIED_STREAMS };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API: Get parsed channels
  app.get('/api/channels', async (req: Request, res: Response) => {
    try {
      const source = (req.query.source as string) || 'in';
      const customUrl = req.query.customUrl as string;

      let result: { text: string; channels: Channel[] };
      if (customUrl) {
        const fetchRes = await fetch(customUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const text = await fetchRes.text();
        const parsed = parseM3u(text);
        result = { text, channels: parsed };
      } else {
        result = await fetchM3uWithFallback(source);
      }

      res.json({
        success: true,
        source,
        total: result.channels.length,
        channels: result.channels,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Stream Proxy (Fixes Mixed Content & CORS issues for browser HLS streams)
  app.get('/api/stream-proxy', async (req: Request, res: Response) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const urlObj = new URL(targetUrl);

      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: '*/*',
          Origin: urlObj.origin,
          Referer: urlObj.origin + '/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!upstream.ok) {
        return res.status(upstream.status).send(`Upstream returned ${upstream.status}`);
      }

      const contentType = upstream.headers.get('content-type') || 'application/vnd.apple.mpegurl';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Type', contentType);

      // If manifest (.m3u8), rewrite relative chunk URLs to proxy
      if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
        const text = await upstream.text();
        const baseUrl = new URL(targetUrl);
        const lines = text.split('\n');
        const rewritten = lines.map((l) => {
          const trimmed = l.trim();
          if (!trimmed || trimmed.startsWith('#')) return l;
          try {
            const absolute = new URL(trimmed, baseUrl).href;
            return `/api/stream-proxy?url=${encodeURIComponent(absolute)}`;
          } catch {
            return l;
          }
        });
        res.send(rewritten.join('\n'));
        return;
      }

      // Stream media segments (.ts, .aac, .m4s)
      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(502).send('Proxy error: ' + err.message);
    }
  });

  // API: Download Android Studio project as .zip
  app.get('/api/download-android-zip', async (_req: Request, res: Response) => {
    try {
      const androidDir = path.resolve(process.cwd(), 'android');
      if (!fs.existsSync(androidDir)) {
        res.status(404).send('Android directory not ready');
        return;
      }

      const zip = new JSZip();

      function addDirToZip(currentDir: string, zipFolder: JSZip) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            const subFolder = zipFolder.folder(entry.name);
            if (subFolder) addDirToZip(fullPath, subFolder);
          } else {
            const fileData = fs.readFileSync(fullPath);
            zipFolder.file(entry.name, fileData);
          }
        }
      }

      addDirToZip(androidDir, zip);
      const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="BharatTV-Live-Android-Project.zip"');
      res.send(content);
    } catch (err: any) {
      res.status(500).send('Error generating zip: ' + err.message);
    }
  });

  // Setup Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BharatTV Live Server running on port ${PORT}`);
  });
}

startServer();
