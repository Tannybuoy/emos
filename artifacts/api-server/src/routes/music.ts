import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { GenerateMusicProfileBody, GenerateMusicProfileResponse } from "@workspace/api-zod";
import { mapStateToMusic } from "../lib/musicMapping.js";
import { searchPlaylists, getRecommendations, getFallbackPlaylists } from "../lib/spotify.js";

const router = Router();

router.post("/generate-music-profile", async (req: Request, res: Response) => {
  try {
    const body = GenerateMusicProfileBody.parse(req.body);
    const { role, states, instrumental, language } = body;

    const profile = mapStateToMusic(states, role, { instrumental, language });
    const sessionId = randomUUID();

    let playlists: Awaited<ReturnType<typeof searchPlaylists>> = [];
    let tracks: Awaited<ReturnType<typeof getRecommendations>> = [];

    const hasSpotify = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

    if (hasSpotify) {
      try {
        [playlists, tracks] = await Promise.all([
          searchPlaylists(profile),
          getRecommendations(profile, states),
        ]);
      } catch (spotifyErr) {
        console.error("Spotify API error, trying fallback:", spotifyErr);
      }

      // Primary search may succeed but return 0 results (all filtered) — try fallback
      if (playlists.length === 0) {
        try {
          playlists = await getFallbackPlaylists(profile);
        } catch (fallbackErr) {
          console.error("Fallback Spotify search also failed:", fallbackErr);
        }
      }

      // Last resort: if both searches returned nothing, use a curated hardcoded playlist
      if (playlists.length === 0) {
        const lastResortId = profile.mood === "calm" ? "37i9dQZF1DX8NTLI2TtZa6"
          : profile.mood === "intense" ? "37i9dQZF1DWZeKCadgRdKQ"
          : "37i9dQZF1DWWQRwui0ExPn";
        playlists = [{
          id: lastResortId,
          name: profile.mood === "calm" ? "Deep Focus" : profile.mood === "intense" ? "Brain Food" : "Lofi Beats",
          description: "Curated playlist for focused work",
          imageUrl: "",
          spotifyUrl: `https://open.spotify.com/playlist/${lastResortId}`,
          embedUrl: `https://open.spotify.com/embed/playlist/${lastResortId}`,
          trackCount: 100,
        }];
      }
    } else {
      console.warn("Spotify credentials not configured — returning mock data");
      playlists = [
        {
          id: "mock-playlist-1",
          name: "Deep Focus",
          description: "Instrumental music for concentration",
          imageUrl: "",
          spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6",
          embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6",
          trackCount: 100,
        },
        {
          id: "mock-playlist-2",
          name: "Lofi Beats",
          description: "Chill lo-fi beats to relax and study",
          imageUrl: "",
          spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
          embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn",
          trackCount: 80,
        },
      ];
    }

    const response = GenerateMusicProfileResponse.parse({
      profile,
      playlists,
      tracks,
      sessionId,
    });

    res.json(response);
  } catch (err) {
    console.error("generate-music-profile error:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.name === "ZodError") {
      res.status(400).json({ error: "validation_error", message: err.message });
    } else {
      res.status(500).json({ error: "internal_error", message: "Failed to generate music profile" });
    }
  }
});

export default router;
