// Server-side Spotify Web API client. Tokens never leave the server.
import type { ArtistInfo, CollectedTrack, PlaylistSummary } from "./types";

const API = "https://api.spotify.com/v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET a Spotify endpoint with 429 retry-after handling. */
async function spotifyGet<T>(token: string, url: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "1");
      await sleep((retryAfter + 1) * 1000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Spotify ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
  throw new Error("Spotify rate-limit retries exhausted");
}

interface Paging<T> {
  items: T[];
  next: string | null;
}

interface RawPlaylist {
  id: string;
  name: string;
  images: { url: string }[] | null;
  owner: { display_name: string | null };
  tracks: { total: number };
}

/** All playlists owned by or followed by the current user. */
export async function getAllPlaylists(token: string): Promise<PlaylistSummary[]> {
  const out: PlaylistSummary[] = [];
  let url: string | null = `${API}/me/playlists?limit=50`;
  while (url) {
    const page: Paging<RawPlaylist> = await spotifyGet(token, url);
    for (const p of page.items) {
      if (!p) continue;
      out.push({
        id: p.id,
        name: p.name,
        trackCount: p.tracks?.total ?? 0,
        image: p.images?.[0]?.url ?? null,
        owner: p.owner?.display_name ?? "",
      });
    }
    url = page.next;
  }
  return out;
}

// /playlists/{id}/items response — the track object is under "item", not "track".
// "track" and "episode" on the outer object are booleans, not nested objects.
interface RawPlaylistItem {
  added_at: string;
  item: {
    id: string | null;
    name: string;
    type: string; // "track" | "episode"
    duration_ms: number;
    popularity: number;
    artists: { id: string; name: string }[];
    album: {
      name: string;
      images: { url: string }[];
      release_date: string;
    };
  } | null;
}

/** All tracks in a playlist, flattened. Local tracks / episodes are skipped. */
export async function getPlaylistTracks(
  token: string,
  playlistId: string,
  playlistName: string,
): Promise<CollectedTrack[]> {
  const out: CollectedTrack[] = [];
  // Use /items (not the deprecated /tracks) — Spotify 403s on the old endpoint.
  let url: string | null = `${API}/playlists/${playlistId}/items?limit=100`;
  while (url) {
    const page: Paging<RawPlaylistItem> = await spotifyGet(token, url);
    for (const item of page.items) {
      const t = item?.item;
      // Skip episodes, local files, and items without artists.
      if (!t || t.type !== "track" || !t.id || !t.artists?.length) continue;
      out.push({
        id: t.id,
        name: t.name,
        artistIds: t.artists.map((a) => a.id),
        artistNames: t.artists.map((a) => a.name),
        albumName: t.album?.name ?? "",
        albumImage: t.album?.images?.[0]?.url ?? null,
        releaseDate: t.album?.release_date ?? "",
        durationMs: t.duration_ms ?? 0,
        popularity: t.popularity ?? 0,
        addedAt: item.added_at,
        playlistId,
        playlistName,
      });
    }
    url = page.next;
  }
  return out;
}

interface RawArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string }[];
}

/** Fetch artist details (genres, popularity, image) in batches of 50. */
export async function getArtists(
  token: string,
  ids: string[],
): Promise<Map<string, ArtistInfo>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, ArtistInfo>();
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const { artists }: { artists: (RawArtist | null)[] } = await spotifyGet(
      token,
      `${API}/artists?ids=${batch.join(",")}`,
    );
    for (const a of artists) {
      if (!a) continue;
      map.set(a.id, {
        id: a.id,
        name: a.name,
        genres: a.genres ?? [],
        popularity: a.popularity ?? 0,
        image: a.images?.[0]?.url ?? null,
      });
    }
  }
  return map;
}

/** Collect every track across the given playlists, plus enriched artist info. */
export async function collectLibrary(
  token: string,
  playlists: { id: string; name: string }[],
): Promise<{ tracks: CollectedTrack[]; artists: Map<string, ArtistInfo> }> {
  const tracks: CollectedTrack[] = [];
  for (const p of playlists) {
    try {
      tracks.push(...(await getPlaylistTracks(token, p.id, p.name)));
    } catch (err) {
      console.warn(`Skipping playlist "${p.name}" (${p.id}):`, err);
    }
  }

  // Try to enrich with artist genres/images from /artists. Spotify restricts
  // this endpoint for Development Mode apps, so fall back to stub artist info
  // built from the names already present in the track data.
  let artists: Map<string, ArtistInfo>;
  try {
    const artistIds = tracks.flatMap((t) => t.artistIds);
    artists = await getArtists(token, artistIds);
  } catch {
    // Build stub artist info from what the track data already has.
    artists = new Map<string, ArtistInfo>();
    for (const t of tracks) {
      t.artistIds.forEach((id, i) => {
        if (!artists.has(id)) {
          artists.set(id, {
            id,
            name: t.artistNames[i] ?? "Unknown",
            genres: [],
            popularity: t.popularity,
            image: null,
          });
        }
      });
    }
  }

  return { tracks, artists };
}
