export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  language: string;
  country?: string;
  resolution?: string;
}

export type PlaylistSourceType = 'in' | 'hin' | 'custom';

export interface PlaylistMeta {
  source: PlaylistSourceType;
  title: string;
  url: string;
  description: string;
}

export const PLAYLIST_SOURCES: PlaylistMeta[] = [
  {
    source: 'in',
    title: 'All India (in.m3u)',
    url: 'https://iptv-org.gitlab.io/iptv/countries/in.m3u',
    description: 'Complete Indian national and regional channels (News, Music, Entertainment, Devotional)',
  },
  {
    source: 'hin',
    title: 'Hindi Channels (hin.m3u)',
    url: 'https://iptv-org.gitlab.io/iptv/languages/hin.m3u',
    description: 'Hindi language broadcasts from India and diaspora',
  },
];
