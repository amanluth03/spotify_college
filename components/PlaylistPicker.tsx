"use client";

import { getSelection, setSelection } from "@/lib/selection";
import type { PlaylistSummary } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function PlaylistPicker({ playlists }: { playlists: PlaylistSummary[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // Restore a previous selection from localStorage after hydration.
  // (A lazy initializer can't read localStorage without an SSR mismatch.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set(getSelection().map((p) => p.id)));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, query]);

  const songCount = useMemo(
    () =>
      playlists
        .filter((p) => selected.has(p.id))
        .reduce((sum, p) => sum + p.trackCount, 0),
    [playlists, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function build() {
    const chosen = playlists
      .filter((p) => selected.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }));
    setSelection(chosen);
    sessionStorage.removeItem("cw:stats-cache");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-32 pt-10 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Pick your college playlists
      </h1>
      <p className="mt-2 text-muted">
        Choose the semester playlists you want to combine into your Wrapped.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search playlists…"
          className="w-full rounded-full border border-white/10 bg-surface px-5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-spotify"
        />
        <div className="flex shrink-0 gap-2 text-sm">
          <button
            onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
            className="rounded-full border border-white/10 px-4 py-2 text-muted transition-colors hover:text-foreground"
          >
            Select all
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-full border border-white/10 px-4 py-2 text-muted transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((p) => {
          const isOn = selected.has(p.id);
          return (
            <li key={p.id}>
              <button
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isOn
                    ? "border-spotify bg-spotify/10"
                    : "border-white/10 bg-surface hover:bg-surface-2"
                }`}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
                    ♪
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{p.trackCount} songs</p>
                </div>
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                    isOn
                      ? "border-spotify bg-spotify text-black"
                      : "border-white/25 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted">No playlists match “{query}”.</p>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-bg/90 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-muted">
            <span className="font-bold text-foreground">{selected.size}</span>{" "}
            playlist{selected.size === 1 ? "" : "s"} ·{" "}
            <span className="font-bold text-foreground">
              {songCount.toLocaleString()}
            </span>{" "}
            songs
          </p>
          <button
            onClick={build}
            disabled={selected.size === 0}
            className="rounded-full bg-spotify px-6 py-3 text-sm font-bold text-black transition-transform enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Build my Wrapped →
          </button>
        </div>
      </div>
    </div>
  );
}
