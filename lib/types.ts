// Shared domain types for College Wrapped.

/** A playlist as listed for the picker. */
export interface PlaylistSummary {
  id: string;
  name: string;
  trackCount: number;
  image: string | null;
  owner: string;
}

/** A single track flattened out of a playlist, ready for stats. */
export interface CollectedTrack {
  id: string;
  name: string;
  artistIds: string[];
  artistNames: string[];
  albumName: string;
  albumImage: string | null;
  /** album release_date: "YYYY", "YYYY-MM", or "YYYY-MM-DD". */
  releaseDate: string;
  durationMs: number;
  /** track popularity, 0-100. */
  popularity: number;
  /** ISO timestamp of when the track was added to the playlist. */
  addedAt: string;
  playlistId: string;
  /** playlist name, used as the semester label. */
  playlistName: string;
}

/** Enriched artist info fetched from the /artists endpoint. */
export interface ArtistInfo {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  image: string | null;
}

export interface ArtistStat {
  id: string;
  name: string;
  image: string | null;
  count: number;
  genres: string[];
}

export interface TrackStat {
  id: string;
  name: string;
  artistNames: string[];
  albumImage: string | null;
  count: number;
  popularity: number;
  durationMs: number;
}

export interface MonthBucket {
  /** "YYYY-MM" */
  month: string;
  /** human label e.g. "Sep '23" */
  label: string;
  count: number;
}

export interface SemesterBucket {
  playlistId: string;
  name: string;
  count: number;
}

export interface GenreStat {
  genre: string;
  count: number;
}

export interface Superlatives {
  longestSong: TrackStat | null;
  shortestSong: TrackStat | null;
  mostObscure: TrackStat | null;
  mostPopular: TrackStat | null;
  oneHitWonderCount: number;
  oneHitWonders: string[];
  theConstant: { track: TrackStat; semesters: number } | null;
  totalListeningHours: number;
  oldestThrowback: { track: TrackStat; year: number } | null;
  newestRelease: { track: TrackStat; year: number } | null;
  busiestDay: { date: string; count: number } | null;
}

export interface GenreEvolution {
  firstLabel: string;
  lastLabel: string;
  first: GenreStat[];
  last: GenreStat[];
}

export interface Stats {
  totalTracks: number;
  totalUnique: number;
  totalArtists: number;
  totalMinutes: number;
  semesterCount: number;
  topArtists: ArtistStat[];
  topTracks: TrackStat[];
  byMonth: MonthBucket[];
  bySemester: SemesterBucket[];
  genres: GenreStat[];
  superlatives: Superlatives;
  genreEvolution: GenreEvolution | null;
}
