// Pure, testable stat computations over collected playlist tracks.
import type {
  ArtistInfo,
  ArtistStat,
  CollectedTrack,
  GenreEvolution,
  GenreStat,
  MonthBucket,
  SemesterBucket,
  Stats,
  Superlatives,
  TrackStat,
} from "./types";

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "YYYY-MM" key from an ISO timestamp. */
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** "YYYY-MM-DD" key from an ISO timestamp. */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  return `${MONTHS[idx] ?? "?"} '${year.slice(2)}`;
}

/** Parse a release year out of "YYYY", "YYYY-MM", or "YYYY-MM-DD". */
function releaseYear(releaseDate: string): number | null {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

function toTrackStat(t: CollectedTrack, count: number): TrackStat {
  return {
    id: t.id,
    name: t.name,
    artistNames: t.artistNames,
    albumImage: t.albumImage,
    count,
    popularity: t.popularity,
    durationMs: t.durationMs,
  };
}

/** Count tracks per artist; ties broken by artist popularity. */
export function topArtists(
  tracks: CollectedTrack[],
  artists: Map<string, ArtistInfo>,
  limit = 20,
): ArtistStat[] {
  const counts = new Map<string, number>();
  for (const t of tracks) {
    for (const id of t.artistIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const stats: ArtistStat[] = [];
  for (const [id, count] of counts) {
    const info = artists.get(id);
    stats.push({
      id,
      name: info?.name ?? "Unknown artist",
      image: info?.image ?? null,
      count,
      genres: info?.genres ?? [],
    });
  }
  stats.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const pa = artists.get(a.id)?.popularity ?? 0;
    const pb = artists.get(b.id)?.popularity ?? 0;
    return pb - pa;
  });
  return stats.slice(0, limit);
}

/** Most-added tracks (same track id added across playlists), ties by popularity. */
export function topTracks(tracks: CollectedTrack[], limit = 20): TrackStat[] {
  const counts = new Map<string, number>();
  const sample = new Map<string, CollectedTrack>();
  for (const t of tracks) {
    counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
    if (!sample.has(t.id)) sample.set(t.id, t);
  }
  const stats = [...counts].map(([id, count]) =>
    toTrackStat(sample.get(id)!, count),
  );
  stats.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.popularity - a.popularity;
  });
  return stats.slice(0, limit);
}

/** Songs added per calendar month, gap-filled from earliest to latest month. */
export function songsByMonth(tracks: CollectedTrack[]): MonthBucket[] {
  if (tracks.length === 0) return [];
  const counts = new Map<string, number>();
  for (const t of tracks) {
    const key = monthKey(t.addedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const keys = [...counts.keys()].sort();
  const first = keys[0];
  const last = keys[keys.length - 1];

  const buckets: MonthBucket[] = [];
  let [y, m] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  // Walk month-by-month so the timeline has no gaps.
  while (y < ly || (y === ly && m <= lm)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    buckets.push({ month: key, label: monthLabel(key), count: counts.get(key) ?? 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return buckets;
}

/** One bucket per playlist (semester), ordered chronologically by first add. */
export function songsBySemester(tracks: CollectedTrack[]): SemesterBucket[] {
  const counts = new Map<string, number>();
  const names = new Map<string, string>();
  const firstAdd = new Map<string, string>();
  for (const t of tracks) {
    counts.set(t.playlistId, (counts.get(t.playlistId) ?? 0) + 1);
    names.set(t.playlistId, t.playlistName);
    const cur = firstAdd.get(t.playlistId);
    if (!cur || t.addedAt < cur) firstAdd.set(t.playlistId, t.addedAt);
  }
  return [...counts]
    .map(([playlistId, count]) => ({
      playlistId,
      name: names.get(playlistId)!,
      count,
    }))
    .sort(
      (a, b) =>
        (firstAdd.get(a.playlistId) ?? "").localeCompare(
          firstAdd.get(b.playlistId) ?? "",
        ),
    );
}

/** Track-weighted genre breakdown: each track contributes its artists' genres once. */
export function genreBreakdown(
  tracks: CollectedTrack[],
  artists: Map<string, ArtistInfo>,
  limit = 15,
): GenreStat[] {
  const counts = new Map<string, number>();
  for (const t of tracks) {
    const genres = new Set<string>();
    for (const id of t.artistIds) {
      for (const g of artists.get(id)?.genres ?? []) genres.add(g);
    }
    for (const g of genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function superlatives(tracks: CollectedTrack[]): Superlatives {
  if (tracks.length === 0) {
    return {
      longestSong: null,
      shortestSong: null,
      mostObscure: null,
      mostPopular: null,
      oneHitWonderCount: 0,
      oneHitWonders: [],
      theConstant: null,
      totalListeningHours: 0,
      oldestThrowback: null,
      newestRelease: null,
      busiestDay: null,
    };
  }

  let longest = tracks[0];
  let shortest = tracks[0];
  let obscure = tracks[0];
  let popular = tracks[0];
  let totalMs = 0;

  for (const t of tracks) {
    totalMs += t.durationMs;
    if (t.durationMs > longest.durationMs) longest = t;
    if (t.durationMs < shortest.durationMs) shortest = t;
    if (t.popularity < obscure.popularity) obscure = t;
    if (t.popularity > popular.popularity) popular = t;
  }

  // One-hit wonders: artists that appear on exactly one track.
  const artistCounts = new Map<string, number>();
  const artistName = new Map<string, string>();
  for (const t of tracks) {
    t.artistIds.forEach((id, i) => {
      artistCounts.set(id, (artistCounts.get(id) ?? 0) + 1);
      artistName.set(id, t.artistNames[i] ?? "Unknown");
    });
  }
  const oneHit = [...artistCounts]
    .filter(([, c]) => c === 1)
    .map(([id]) => artistName.get(id)!);

  // The constant: track present in the most distinct semesters (playlists).
  const trackSemesters = new Map<string, Set<string>>();
  const trackSample = new Map<string, CollectedTrack>();
  const dayCounts = new Map<string, number>();
  for (const t of tracks) {
    if (!trackSemesters.has(t.id)) trackSemesters.set(t.id, new Set());
    trackSemesters.get(t.id)!.add(t.playlistId);
    if (!trackSample.has(t.id)) trackSample.set(t.id, t);
    const d = dayKey(t.addedAt);
    dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1);
  }
  let constant: { track: TrackStat; semesters: number } | null = null;
  for (const [id, sems] of trackSemesters) {
    if (sems.size > 1 && (!constant || sems.size > constant.semesters)) {
      constant = { track: toTrackStat(trackSample.get(id)!, sems.size), semesters: sems.size };
    }
  }

  // Oldest / newest by release year.
  let oldest: { track: TrackStat; year: number } | null = null;
  let newest: { track: TrackStat; year: number } | null = null;
  for (const t of tracks) {
    const year = releaseYear(t.releaseDate);
    if (year === null) continue;
    if (!oldest || year < oldest.year) oldest = { track: toTrackStat(t, 1), year };
    if (!newest || year > newest.year) newest = { track: toTrackStat(t, 1), year };
  }

  // Busiest add-day.
  let busiestDay: { date: string; count: number } | null = null;
  for (const [date, count] of dayCounts) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { date, count };
  }

  return {
    longestSong: toTrackStat(longest, 1),
    shortestSong: toTrackStat(shortest, 1),
    mostObscure: toTrackStat(obscure, 1),
    mostPopular: toTrackStat(popular, 1),
    oneHitWonderCount: oneHit.length,
    oneHitWonders: oneHit.slice(0, 8),
    theConstant: constant,
    totalListeningHours: Math.round(totalMs / MS_PER_HOUR),
    oldestThrowback: oldest,
    newestRelease: newest,
    busiestDay,
  };
}

/** Top genres of the first vs last semester, for a "taste evolved" story card. */
export function genreEvolution(
  tracks: CollectedTrack[],
  artists: Map<string, ArtistInfo>,
): GenreEvolution | null {
  const semesters = songsBySemester(tracks);
  if (semesters.length < 2) return null;
  const firstId = semesters[0].playlistId;
  const lastId = semesters[semesters.length - 1].playlistId;
  const first = genreBreakdown(
    tracks.filter((t) => t.playlistId === firstId),
    artists,
    3,
  );
  const last = genreBreakdown(
    tracks.filter((t) => t.playlistId === lastId),
    artists,
    3,
  );
  return {
    firstLabel: semesters[0].name,
    lastLabel: semesters[semesters.length - 1].name,
    first,
    last,
  };
}

/** Compute the full Stats bundle from collected tracks + artist lookup. */
export function computeStats(
  tracks: CollectedTrack[],
  artists: Map<string, ArtistInfo>,
): Stats {
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
  const uniqueTracks = new Set(tracks.map((t) => t.id));
  const uniqueArtists = new Set<string>();
  for (const t of tracks) for (const id of t.artistIds) uniqueArtists.add(id);

  return {
    totalTracks: tracks.length,
    totalUnique: uniqueTracks.size,
    totalArtists: uniqueArtists.size,
    totalMinutes: Math.round(totalMs / MS_PER_MINUTE),
    semesterCount: new Set(tracks.map((t) => t.playlistId)).size,
    topArtists: topArtists(tracks, artists),
    topTracks: topTracks(tracks),
    byMonth: songsByMonth(tracks),
    bySemester: songsBySemester(tracks),
    genres: genreBreakdown(tracks, artists),
    superlatives: superlatives(tracks),
    genreEvolution: genreEvolution(tracks, artists),
  };
}
