"use client";

import { GenreDonut, MonthlyTimeline } from "@/components/charts";
import { useStats } from "@/hooks/useStats";
import type {
  ArtistStat,
  SemesterBucket,
  Stats,
  TrackStat,
} from "@/lib/types";
import Link from "next/link";

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DashboardClient() {
  const state = useStats();

  if (state.status === "loading") {
    return (
      <Centered>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-spotify" />
        <p className="mt-4 text-muted">Crunching your college years…</p>
      </Centered>
    );
  }

  if (state.status === "empty") {
    return (
      <Centered>
        <p className="text-lg font-semibold">No playlists selected yet.</p>
        <Link
          href="/playlists"
          className="mt-4 rounded-full bg-spotify px-6 py-3 text-sm font-bold text-black"
        >
          Pick your playlists
        </Link>
      </Centered>
    );
  }

  if (state.status === "error") {
    const msg =
      state.error === "token_expired"
        ? "Your Spotify session expired — log in again."
        : "Something went wrong building your stats.";
    return (
      <Centered>
        <p className="text-lg font-semibold">{msg}</p>
        <Link
          href="/playlists"
          className="mt-4 rounded-full border border-white/15 px-6 py-3 text-sm font-bold"
        >
          Back to playlists
        </Link>
      </Centered>
    );
  }

  const stats = state.stats;
  const biggestMonth = [...stats.byMonth].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-8">
      {/* Hero */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your College Wrapped
          </h1>
          <p className="mt-1 text-muted">
            {stats.semesterCount} semesters · {stats.totalTracks.toLocaleString()}{" "}
            songs
          </p>
        </div>
        <Link
          href="/wrapped"
          className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-spotify-bright to-lime px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105"
        >
          ▶ Play my Wrapped
        </Link>
      </div>

      {/* Summary numbers */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Songs" value={stats.totalTracks.toLocaleString()} />
        <Stat label="Unique tracks" value={stats.totalUnique.toLocaleString()} />
        <Stat label="Artists" value={stats.totalArtists.toLocaleString()} />
        <Stat
          label="Hours of music"
          value={Math.round(stats.totalMinutes / 60).toLocaleString()}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Top artists">
          <ArtistBoard artists={stats.topArtists.slice(0, 8)} />
        </Section>

        <Section title="Top tracks">
          <TrackBoard tracks={stats.topTracks.slice(0, 8)} />
        </Section>

        <Section
          title="Songs added over time"
          subtitle={
            biggestMonth
              ? `Biggest month: ${biggestMonth.label} (${biggestMonth.count} songs)`
              : undefined
          }
          className="lg:col-span-2"
        >
          <MonthlyTimeline data={stats.byMonth} />
        </Section>

        <Section title="By semester">
          <SemesterBars data={stats.bySemester} />
        </Section>

        <Section title="Top genres">
          <GenreDonut data={stats.genres} />
        </Section>
      </div>

      {/* Superlatives */}
      <h2 className="mt-10 text-xl font-bold">Superlatives</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Superlatives stats={stats} formatDuration={formatDuration} />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface p-4">
      <p className="text-2xl font-extrabold sm:text-3xl">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/5 bg-surface p-5 ${className}`}
    >
      <h3 className="font-bold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-spotify-bright">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ArtistBoard({ artists }: { artists: ArtistStat[] }) {
  const max = artists[0]?.count ?? 1;
  return (
    <ol className="space-y-2.5">
      {artists.map((a, i) => (
        <li key={a.id} className="flex items-center gap-3">
          <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
          {a.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.image} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-surface-2" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{a.name}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-spotify"
                style={{ width: `${(a.count / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted">{a.count}</span>
        </li>
      ))}
    </ol>
  );
}

function TrackBoard({ tracks }: { tracks: TrackStat[] }) {
  return (
    <ol className="space-y-2.5">
      {tracks.map((t, i) => (
        <li key={t.id} className="flex items-center gap-3">
          <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
          {t.albumImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.albumImage} alt="" className="h-9 w-9 rounded object-cover" />
          ) : (
            <div className="h-9 w-9 rounded bg-surface-2" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t.name}</p>
            <p className="truncate text-xs text-muted">
              {t.artistNames.join(", ")}
            </p>
          </div>
          {t.count > 1 && (
            <span className="rounded-full bg-spotify/15 px-2 py-0.5 text-xs text-spotify-bright">
              ×{t.count}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function SemesterBars({ data }: { data: SemesterBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ul className="space-y-2">
      {data.map((s) => (
        <li key={s.playlistId} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted" title={s.name}>
            {s.name}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-grape to-magenta"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs text-muted">{s.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Superlatives({
  stats,
  formatDuration,
}: {
  stats: Stats;
  formatDuration: (ms: number) => string;
}) {
  const s = stats.superlatives;
  const cards: { emoji: string; label: string; value: string; sub?: string }[] =
    [];

  if (s.longestSong)
    cards.push({
      emoji: "⏳",
      label: "Longest song",
      value: s.longestSong.name,
      sub: `${formatDuration(s.longestSong.durationMs)} · ${s.longestSong.artistNames[0]}`,
    });
  if (s.shortestSong)
    cards.push({
      emoji: "⚡",
      label: "Shortest song",
      value: s.shortestSong.name,
      sub: `${formatDuration(s.shortestSong.durationMs)} · ${s.shortestSong.artistNames[0]}`,
    });
  if (s.mostObscure)
    cards.push({
      emoji: "🔮",
      label: "Deepest cut",
      value: s.mostObscure.name,
      sub: `popularity ${s.mostObscure.popularity} · ${s.mostObscure.artistNames[0]}`,
    });
  if (s.mostPopular)
    cards.push({
      emoji: "🔥",
      label: "Biggest hit",
      value: s.mostPopular.name,
      sub: `popularity ${s.mostPopular.popularity} · ${s.mostPopular.artistNames[0]}`,
    });
  if (s.theConstant)
    cards.push({
      emoji: "🧷",
      label: "The constant",
      value: s.theConstant.track.name,
      sub: `re-added across ${s.theConstant.semesters} semesters`,
    });
  cards.push({
    emoji: "🎲",
    label: "One-hit wonders",
    value: `${s.oneHitWonderCount} artists`,
    sub: s.oneHitWonders.slice(0, 3).join(", "),
  });
  if (s.oldestThrowback)
    cards.push({
      emoji: "📻",
      label: "Oldest throwback",
      value: `${s.oldestThrowback.year}`,
      sub: s.oldestThrowback.track.name,
    });
  if (s.newestRelease)
    cards.push({
      emoji: "🆕",
      label: "Freshest release",
      value: `${s.newestRelease.year}`,
      sub: s.newestRelease.track.name,
    });
  if (s.busiestDay)
    cards.push({
      emoji: "📅",
      label: "Busiest day",
      value: `${s.busiestDay.count} songs`,
      sub: s.busiestDay.date,
    });

  return (
    <>
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-white/5 bg-surface p-4"
        >
          <p className="text-2xl">{c.emoji}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-muted">
            {c.label}
          </p>
          <p className="mt-0.5 truncate font-bold" title={c.value}>
            {c.value}
          </p>
          {c.sub && <p className="truncate text-xs text-muted">{c.sub}</p>}
        </div>
      ))}
    </>
  );
}
