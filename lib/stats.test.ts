import { describe, expect, it } from "vitest";
import type { ArtistInfo, CollectedTrack } from "./types";
import {
  computeStats,
  genreBreakdown,
  genreEvolution,
  songsByMonth,
  songsBySemester,
  superlatives,
  topArtists,
  topTracks,
} from "./stats";

function track(overrides: Partial<CollectedTrack>): CollectedTrack {
  return {
    id: "t1",
    name: "Song",
    artistIds: ["a1"],
    artistNames: ["Artist One"],
    albumName: "Album",
    albumImage: null,
    releaseDate: "2022-01-01",
    durationMs: 200_000,
    popularity: 50,
    addedAt: "2022-09-15T12:00:00Z",
    playlistId: "p1",
    playlistName: "Freshman Fall",
    ...overrides,
  };
}

const artists = new Map<string, ArtistInfo>([
  ["a1", { id: "a1", name: "Artist One", genres: ["indie", "rock"], popularity: 70, image: null }],
  ["a2", { id: "a2", name: "Artist Two", genres: ["hip hop"], popularity: 90, image: null }],
  ["a3", { id: "a3", name: "Artist Three", genres: ["rock"], popularity: 40, image: null }],
]);

describe("topArtists", () => {
  it("counts tracks per artist and ranks by count", () => {
    const tracks = [
      track({ id: "t1", artistIds: ["a1"] }),
      track({ id: "t2", artistIds: ["a1"] }),
      track({ id: "t3", artistIds: ["a2"] }),
    ];
    const result = topArtists(tracks, artists);
    expect(result[0]).toMatchObject({ id: "a1", count: 2 });
    expect(result[1]).toMatchObject({ id: "a2", count: 1 });
  });

  it("breaks ties by artist popularity", () => {
    const tracks = [
      track({ id: "t1", artistIds: ["a1"] }), // popularity 70
      track({ id: "t2", artistIds: ["a2"] }), // popularity 90
    ];
    const result = topArtists(tracks, artists);
    expect(result[0].id).toBe("a2");
  });

  it("counts every collaborating artist on a track", () => {
    const tracks = [track({ id: "t1", artistIds: ["a1", "a2"] })];
    const result = topArtists(tracks, artists);
    expect(result.map((r) => r.id).sort()).toEqual(["a1", "a2"]);
  });
});

describe("topTracks", () => {
  it("counts the same track id across playlists", () => {
    const tracks = [
      track({ id: "t1", playlistId: "p1" }),
      track({ id: "t1", playlistId: "p2" }),
      track({ id: "t2", playlistId: "p1" }),
    ];
    const result = topTracks(tracks);
    expect(result[0]).toMatchObject({ id: "t1", count: 2 });
  });
});

describe("songsByMonth", () => {
  it("buckets by month and gap-fills missing months with zero", () => {
    const tracks = [
      track({ id: "t1", addedAt: "2022-09-01T00:00:00Z" }),
      track({ id: "t2", addedAt: "2022-09-20T00:00:00Z" }),
      track({ id: "t3", addedAt: "2022-12-05T00:00:00Z" }),
    ];
    const result = songsByMonth(tracks);
    expect(result).toHaveLength(4); // Sep, Oct, Nov, Dec
    expect(result[0]).toMatchObject({ month: "2022-09", count: 2 });
    expect(result[1]).toMatchObject({ month: "2022-10", count: 0 });
    expect(result[3]).toMatchObject({ month: "2022-12", count: 1 });
  });

  it("rolls over year boundaries", () => {
    const tracks = [
      track({ id: "t1", addedAt: "2022-11-01T00:00:00Z" }),
      track({ id: "t2", addedAt: "2023-01-01T00:00:00Z" }),
    ];
    const result = songsByMonth(tracks);
    expect(result.map((b) => b.month)).toEqual(["2022-11", "2022-12", "2023-01"]);
  });

  it("returns empty for no tracks", () => {
    expect(songsByMonth([])).toEqual([]);
  });
});

describe("songsBySemester", () => {
  it("counts per playlist and orders by earliest add", () => {
    const tracks = [
      track({ id: "t1", playlistId: "p2", playlistName: "Spring", addedAt: "2023-01-10T00:00:00Z" }),
      track({ id: "t2", playlistId: "p1", playlistName: "Fall", addedAt: "2022-09-10T00:00:00Z" }),
      track({ id: "t3", playlistId: "p1", playlistName: "Fall", addedAt: "2022-10-10T00:00:00Z" }),
    ];
    const result = songsBySemester(tracks);
    expect(result[0]).toMatchObject({ name: "Fall", count: 2 });
    expect(result[1]).toMatchObject({ name: "Spring", count: 1 });
  });
});

describe("genreBreakdown", () => {
  it("counts each genre once per track, weighted by track count", () => {
    const tracks = [
      track({ id: "t1", artistIds: ["a1"] }), // indie, rock
      track({ id: "t2", artistIds: ["a3"] }), // rock
    ];
    const result = genreBreakdown(tracks, artists);
    expect(result.find((g) => g.genre === "rock")?.count).toBe(2);
    expect(result.find((g) => g.genre === "indie")?.count).toBe(1);
  });

  it("dedupes genres shared by collaborating artists on one track", () => {
    const tracks = [track({ id: "t1", artistIds: ["a1", "a3"] })]; // both have rock
    const result = genreBreakdown(tracks, artists);
    expect(result.find((g) => g.genre === "rock")?.count).toBe(1);
  });
});

describe("superlatives", () => {
  const tracks = [
    track({ id: "t1", durationMs: 100_000, popularity: 10, releaseDate: "2010" }),
    track({ id: "t2", durationMs: 400_000, popularity: 95, releaseDate: "2024-05-01" }),
    track({ id: "t1", playlistId: "p2", playlistName: "Spring" }), // repeat across semesters
  ];

  it("finds longest and shortest by duration", () => {
    const s = superlatives(tracks);
    expect(s.longestSong?.id).toBe("t2");
    expect(s.shortestSong?.id).toBe("t1");
  });

  it("finds most obscure and most popular by popularity", () => {
    const s = superlatives(tracks);
    expect(s.mostObscure?.id).toBe("t1");
    expect(s.mostPopular?.id).toBe("t2");
  });

  it("identifies the constant track across semesters", () => {
    const s = superlatives(tracks);
    expect(s.theConstant?.track.id).toBe("t1");
    expect(s.theConstant?.semesters).toBe(2);
  });

  it("finds oldest and newest release years", () => {
    const s = superlatives(tracks);
    expect(s.oldestThrowback?.year).toBe(2010);
    expect(s.newestRelease?.year).toBe(2024);
  });

  it("sums total listening hours", () => {
    const s = superlatives(tracks);
    // (100000 + 400000 + 200000) ms = 700s ≈ 0 hours rounded
    expect(s.totalListeningHours).toBe(0);
  });

  it("counts one-hit-wonder artists", () => {
    const single = [
      track({ id: "t1", artistIds: ["a1"], artistNames: ["Artist One"] }),
      track({ id: "t2", artistIds: ["a1"], artistNames: ["Artist One"] }),
      track({ id: "t3", artistIds: ["a2"], artistNames: ["Artist Two"] }),
    ];
    const s = superlatives(single);
    expect(s.oneHitWonderCount).toBe(1);
    expect(s.oneHitWonders).toContain("Artist Two");
  });

  it("handles empty input", () => {
    const s = superlatives([]);
    expect(s.longestSong).toBeNull();
    expect(s.totalListeningHours).toBe(0);
  });
});

describe("genreEvolution", () => {
  it("compares first and last semester genres", () => {
    const tracks = [
      track({ id: "t1", playlistId: "p1", playlistName: "Fall", addedAt: "2022-09-01T00:00:00Z", artistIds: ["a2"] }),
      track({ id: "t2", playlistId: "p2", playlistName: "Senior Spring", addedAt: "2025-01-01T00:00:00Z", artistIds: ["a1"] }),
    ];
    const result = genreEvolution(tracks, artists);
    expect(result?.firstLabel).toBe("Fall");
    expect(result?.lastLabel).toBe("Senior Spring");
    expect(result?.first[0].genre).toBe("hip hop");
    expect(result?.last.some((g) => g.genre === "indie")).toBe(true);
  });

  it("returns null with fewer than two semesters", () => {
    expect(genreEvolution([track({})], artists)).toBeNull();
  });
});

describe("computeStats", () => {
  it("assembles a full stats bundle", () => {
    const tracks = [
      track({ id: "t1", artistIds: ["a1"], playlistId: "p1" }),
      track({ id: "t2", artistIds: ["a2"], playlistId: "p2", playlistName: "Spring", addedAt: "2023-02-01T00:00:00Z" }),
    ];
    const stats = computeStats(tracks, artists);
    expect(stats.totalTracks).toBe(2);
    expect(stats.totalUnique).toBe(2);
    expect(stats.totalArtists).toBe(2);
    expect(stats.semesterCount).toBe(2);
    expect(stats.topArtists.length).toBeGreaterThan(0);
    expect(stats.bySemester).toHaveLength(2);
  });
});
