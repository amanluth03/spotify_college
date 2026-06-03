"use client";

import { useStats } from "@/hooks/useStats";
import type { Stats } from "@/lib/types";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Card {
  bg: string;
  content: React.ReactNode;
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
    {children}
  </p>
);

function buildCards(stats: Stats): Card[] {
  const cards: Card[] = [];
  const topArtist = stats.topArtists[0];
  const topTrack = stats.topTracks[0];
  const biggestMonth = [...stats.byMonth].sort((a, b) => b.count - a.count)[0];
  const topGenre = stats.genres[0];
  const s = stats.superlatives;

  cards.push({
    bg: "from-grape via-magenta to-tangerine",
    content: (
      <>
        <Reveal>
          <Eyebrow>Your college years had a soundtrack</Eyebrow>
        </Reveal>
        <Reveal delay={0.2}>
          <h1 className="mt-4 text-5xl font-black leading-[1.05] sm:text-7xl">
            {stats.semesterCount} semesters.
            <br />
            {stats.totalTracks.toLocaleString()} songs.
          </h1>
        </Reveal>
        <Reveal delay={0.5}>
          <p className="mt-6 text-lg text-black/70">Let&apos;s rewind. →</p>
        </Reveal>
      </>
    ),
  });

  if (topArtist) {
    cards.push({
      bg: "from-spotify-bright via-lime to-sky",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your #1 artist</Eyebrow>
          </Reveal>
          {topArtist.image && (
            <Reveal delay={0.2}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={topArtist.image}
                alt=""
                className="mt-6 h-44 w-44 rounded-2xl object-cover shadow-2xl"
              />
            </Reveal>
          )}
          <Reveal delay={0.35}>
            <h1 className="mt-6 text-5xl font-black sm:text-6xl">
              {topArtist.name}
            </h1>
          </Reveal>
          <Reveal delay={0.55}>
            <p className="mt-3 text-lg text-black/70">
              on {topArtist.count} of your songs
            </p>
          </Reveal>
        </>
      ),
    });
  }

  if (stats.topArtists.length > 1) {
    cards.push({
      bg: "from-sky via-grape to-magenta",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your top artists</Eyebrow>
          </Reveal>
          <ol className="mt-6 space-y-3">
            {stats.topArtists.slice(0, 5).map((a, i) => (
              <Reveal key={a.id} delay={0.15 + i * 0.12}>
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-black tabular-nums">{i + 1}</span>
                  <span className="text-2xl font-bold sm:text-3xl">{a.name}</span>
                </div>
              </Reveal>
            ))}
          </ol>
        </>
      ),
    });
  }

  if (topTrack) {
    cards.push({
      bg: "from-tangerine via-lime to-spotify-bright",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your most-added song</Eyebrow>
          </Reveal>
          {topTrack.albumImage && (
            <Reveal delay={0.2}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={topTrack.albumImage}
                alt=""
                className="mt-6 h-44 w-44 rounded-2xl object-cover shadow-2xl"
              />
            </Reveal>
          )}
          <Reveal delay={0.35}>
            <h1 className="mt-6 text-4xl font-black sm:text-5xl">{topTrack.name}</h1>
          </Reveal>
          <Reveal delay={0.55}>
            <p className="mt-3 text-lg text-black/70">
              {topTrack.artistNames.join(", ")}
            </p>
          </Reveal>
        </>
      ),
    });
  }

  if (biggestMonth) {
    cards.push({
      bg: "from-magenta via-tangerine to-lime",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your busiest month</Eyebrow>
          </Reveal>
          <Reveal delay={0.2}>
            <h1 className="mt-4 text-6xl font-black sm:text-8xl">
              {biggestMonth.label}
            </h1>
          </Reveal>
          <Reveal delay={0.45}>
            <p className="mt-4 text-xl text-black/70">
              You added {biggestMonth.count} songs. Big month for you.
            </p>
          </Reveal>
        </>
      ),
    });
  }

  cards.push({
    bg: "from-spotify-bright via-sky to-grape",
    content: (
      <>
        <Reveal>
          <Eyebrow>All together that&apos;s</Eyebrow>
        </Reveal>
        <Reveal delay={0.2}>
          <h1 className="mt-4 text-7xl font-black sm:text-9xl">
            {Math.round(stats.totalMinutes / 60).toLocaleString()}
          </h1>
        </Reveal>
        <Reveal delay={0.4}>
          <p className="mt-2 text-2xl font-bold">hours of music</p>
        </Reveal>
      </>
    ),
  });

  if (topGenre) {
    cards.push({
      bg: "from-lime via-spotify-bright to-sky",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your sound was mostly</Eyebrow>
          </Reveal>
          <Reveal delay={0.2}>
            <h1 className="mt-4 text-5xl font-black capitalize sm:text-7xl">
              {topGenre.genre}
            </h1>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-6 flex flex-wrap gap-2">
              {stats.genres.slice(1, 6).map((g) => (
                <span
                  key={g.genre}
                  className="rounded-full bg-black/15 px-3 py-1 text-sm font-semibold capitalize"
                >
                  {g.genre}
                </span>
              ))}
            </div>
          </Reveal>
        </>
      ),
    });
  }

  if (stats.genreEvolution) {
    const ev = stats.genreEvolution;
    cards.push({
      bg: "from-grape via-sky to-spotify-bright",
      content: (
        <>
          <Reveal>
            <Eyebrow>Your taste evolved</Eyebrow>
          </Reveal>
          <div className="mt-6 space-y-6">
            <Reveal delay={0.2}>
              <p className="text-sm font-semibold text-black/60">
                {ev.firstLabel}
              </p>
              <p className="text-3xl font-black capitalize">
                {ev.first.map((g) => g.genre).join(" · ") || "—"}
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="text-4xl">↓</p>
            </Reveal>
            <Reveal delay={0.55}>
              <p className="text-sm font-semibold text-black/60">
                {ev.lastLabel}
              </p>
              <p className="text-3xl font-black capitalize">
                {ev.last.map((g) => g.genre).join(" · ") || "—"}
              </p>
            </Reveal>
          </div>
        </>
      ),
    });
  }

  if (s.theConstant) {
    cards.push({
      bg: "from-tangerine via-magenta to-grape",
      content: (
        <>
          <Reveal>
            <Eyebrow>The constant</Eyebrow>
          </Reveal>
          <Reveal delay={0.2}>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl">
              {s.theConstant.track.name}
            </h1>
          </Reveal>
          <Reveal delay={0.45}>
            <p className="mt-4 text-xl text-black/70">
              The one song you came back to across {s.theConstant.semesters}{" "}
              different semesters.
            </p>
          </Reveal>
        </>
      ),
    });
  }

  cards.push({
    bg: "from-spotify-bright via-lime to-tangerine",
    content: (
      <>
        <Reveal>
          <Eyebrow>A few college superlatives</Eyebrow>
        </Reveal>
        <ul className="mt-6 space-y-4 text-left">
          {s.oldestThrowback && (
            <Reveal delay={0.15}>
              <p className="text-xl font-bold">
                📻 Oldest throwback: {s.oldestThrowback.year}
              </p>
            </Reveal>
          )}
          {s.mostObscure && (
            <Reveal delay={0.3}>
              <p className="text-xl font-bold">
                🔮 Deepest cut: {s.mostObscure.name}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.45}>
            <p className="text-xl font-bold">
              🎲 {s.oneHitWonderCount} one-hit wonders
            </p>
          </Reveal>
        </ul>
      </>
    ),
  });

  cards.push({
    bg: "from-grape via-magenta to-spotify-bright",
    content: (
      <>
        <Reveal>
          <h1 className="text-5xl font-black sm:text-7xl">That&apos;s a wrap.</h1>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-4 text-lg text-black/70">
            The soundtrack of your college years, all in one place.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-full bg-black px-7 py-3 font-bold text-white transition-transform hover:scale-105"
          >
            Explore the full dashboard
          </Link>
        </Reveal>
      </>
    ),
  });

  return cards;
}

export function WrappedClient() {
  const state = useStats();
  const [index, setIndex] = useState(0);

  const cards = useMemo(
    () => (state.status === "ready" ? buildCards(state.stats) : []),
    [state],
  );

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, cards.length - 1)),
    [cards.length],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (state.status === "loading") {
    return (
      <Fallback>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-spotify" />
      </Fallback>
    );
  }
  if (state.status !== "ready") {
    return (
      <Fallback>
        <p className="text-lg font-semibold">No Wrapped to show yet.</p>
        <Link
          href="/playlists"
          className="mt-4 rounded-full bg-spotify px-6 py-3 text-sm font-bold text-black"
        >
          Pick your playlists
        </Link>
      </Fallback>
    );
  }

  const card = cards[index];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* progress segments */}
      <div className="absolute inset-x-0 top-0 z-30 flex gap-1.5 p-3">
        {cards.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="absolute right-4 top-6 z-30 text-2xl text-white/70 hover:text-white"
        aria-label="Close"
      >
        ✕
      </Link>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) next();
            else if (info.offset.x > 80) prev();
          }}
          onClick={(e) => {
            // Tap left third → previous, otherwise advance.
            const { left, width } = e.currentTarget.getBoundingClientRect();
            if (e.clientX - left < width / 3) prev();
            else next();
          }}
          className={`flex h-full w-full select-none flex-col justify-center bg-gradient-to-br ${card.bg} px-8 text-black sm:px-20`}
        >
          <div className="mx-auto w-full max-w-xl">{card.content}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Fallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center">
      {children}
    </div>
  );
}
