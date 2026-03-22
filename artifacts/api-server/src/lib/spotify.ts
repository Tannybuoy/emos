import type { MusicProfile } from "./musicMapping.js";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

interface SpotifyPlaylistItem {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  tracks: { total: number };
}

interface SpotifySearchResponse {
  playlists: {
    items: SpotifyPlaylistItem[];
  };
}

interface SpotifyTrackArtist {
  name: string;
}

interface SpotifyTrackAlbum {
  name: string;
  images: SpotifyImage[];
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyTrackArtist[];
  album: SpotifyTrackAlbum;
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyTrackSearchResponse {
  tracks: {
    items: SpotifyTrackItem[];
  };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify auth failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export interface PlaylistResult {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  spotifyUrl: string;
  embedUrl: string;
  trackCount: number;
}

export interface TrackResult {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  albumImageUrl: string;
  previewUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
}

export async function searchPlaylists(profile: MusicProfile): Promise<PlaylistResult[]> {
  const token = await getAccessToken();

  const query = encodeURIComponent(profile.searchQuery);
  // Fetch 10 so we can filter and still reliably return 1 good match
  const url = `https://api.spotify.com/v1/search?q=${query}&type=playlist&limit=10`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify search failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as SpotifySearchResponse;

  const PLAYLIST_INSTRUMENTAL_MARKERS = /\b(instrumental|karaoke|backing track)\b/i;

  return (data.playlists?.items ?? [])
    .filter((p) => {
      if (!p || !p.id || !p.name) return false;
      const nameLower = p.name.toLowerCase();
      const descLower = (p.description ?? "").toLowerCase();
      // If user wants vocal music, reject playlists explicitly labelled instrumental
      if (!profile.instrumental && PLAYLIST_INSTRUMENTAL_MARKERS.test(nameLower)) return false;
      // If user wants instrumental, reject playlists clearly full of vocal/karaoke content
      if (profile.instrumental && /\b(karaoke|party mix|hits)\b/i.test(nameLower)) return false;
      void descLower;
      return true;
    })
    .slice(0, 1)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      imageUrl: p.images?.[0]?.url ?? "",
      spotifyUrl: p.external_urls.spotify,
      embedUrl: `https://open.spotify.com/embed/playlist/${p.id}`,
      trackCount: p.tracks?.total ?? 0,
    }));
}

const TRACK_STATE_KEYWORDS: Record<string, string> = {
  Focused: "focus deep concentration",
  "Locked-in": "flow state zone",
  Stressed: "stress relief calm",
  Anxious: "anxiety relief soothing",
  Overwhelmed: "peaceful slow ambient",
  Energized: "energetic upbeat pump up",
  Tired: "gentle wake up mellow",
  Bored: "eclectic unexpected discovery",
  Curious: "experimental exploration",
  "In Control": "confident powerful",
  Distracted: "minimal drone ambient",
  Calm: "serene tranquil peaceful",
  Start: "motivating kickstart morning",
  Finish: "push finish strong final",
  Continue: "steady drive momentum",
  Recover: "recovery soft restore",
};

// Same genre-native terms as musicMapping — language must come FIRST
const TRACK_LANGUAGE_GENRES: Record<string, string> = {
  english:    "pop indie",
  spanish:    "pop latino reggaeton",
  french:     "french pop chanson",
  japanese:   "j-pop jpop",
  korean:     "kpop k-pop",
  portuguese: "mpb sertanejo",
  hindi:      "bollywood hindi",
  arabic:     "arabic pop",
  german:     "deutschpop german",
};

function buildTrackQuery(profile: MusicProfile, states: string[]): string {
  const parts: string[] = [];

  // 1. Language genre FIRST — drives language of results
  const langGenre = profile.language && profile.language !== "any"
    ? TRACK_LANGUAGE_GENRES[profile.language]
    : null;
  if (langGenre) parts.push(langGenre);

  // 2. Instrumental flag; when vocal+no language, anchor to "pop" genre
  // (avoids vocal-exercise content that the keyword "vocal" attracts)
  if (profile.instrumental) {
    parts.push("instrumental");
  } else if (!langGenre) {
    parts.push("pop");
  }

  // 3. Mood + energy
  if (profile.mood === "calm") parts.push("calm");
  if (profile.mood === "intense") parts.push("intense");
  if (profile.mood === "uplifting") parts.push("uplifting");
  if (profile.energyLevel === "low") parts.push("chill");
  if (profile.energyLevel === "high") parts.push("energetic");

  // 4. Top 2 state keywords
  for (const state of states.slice(0, 2)) {
    const kw = TRACK_STATE_KEYWORDS[state];
    if (kw) parts.push(kw);
  }

  const unique = [...new Set(parts.flatMap((p) => p.split(" ")))];
  return unique.slice(0, 7).join(" ");
}

export async function getRecommendations(profile: MusicProfile, states: string[] = []): Promise<TrackResult[]> {
  const token = await getAccessToken();

  const query = encodeURIComponent(buildTrackQuery(profile, states));
  // Fetch 10; post-filtering handles bad matches
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify track search failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as SpotifyTrackSearchResponse;

  const INSTRUMENTAL_MARKERS = /\b(instrumental|karaoke|backing track|minus one|no vocal|no voice|off vocal)\b/i;

  return (data.tracks?.items ?? [])
    .filter((t) => {
      if (!t || !t.id) return false;
      // Hard filter: if user asked for vocal, drop anything explicitly marked instrumental
      if (!profile.instrumental && INSTRUMENTAL_MARKERS.test(t.name)) return false;
      // Inverse: if user asked for instrumental, drop tracks with "vocal version" / "radio edit"
      if (profile.instrumental && /\b(vocal version|radio edit|feat\.)\b/i.test(t.name)) return false;
      return true;
    })
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      albumName: t.album.name,
      albumImageUrl: t.album.images?.[0]?.url ?? "",
      previewUrl: t.preview_url,
      spotifyUrl: t.external_urls.spotify,
      durationMs: t.duration_ms,
    }));
}

export async function getFallbackPlaylists(profile: MusicProfile): Promise<PlaylistResult[]> {
  const queryMap: Record<string, string> = {
    calm: "lofi focus work",
    intense: "deep work focus techno",
    uplifting: "upbeat motivation work",
  };
  const query = queryMap[profile.mood] ?? "focus work playlist";
  return searchPlaylists({ ...profile, searchQuery: query });
}
