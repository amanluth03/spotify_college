"use client";

import { getSelection } from "@/lib/selection";
import type { Stats } from "@/lib/types";
import { useEffect, useState } from "react";

type State =
  | { status: "loading"; stats: null; error: null }
  | { status: "empty"; stats: null; error: null }
  | { status: "error"; stats: null; error: string }
  | { status: "ready"; stats: Stats; error: null };

const CACHE_KEY = "cw:stats-cache";

/**
 * Reads the selected playlists from localStorage, then fetches computed stats
 * from /api/stats. Results are cached in sessionStorage keyed by the selection
 * so navigating between the dashboard and the Wrapped story doesn't refetch.
 */
export function useStats(): State {
  const [state, setState] = useState<State>({
    status: "loading",
    stats: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const selection = getSelection();
      if (selection.length === 0) {
        if (!cancelled) setState({ status: "empty", stats: null, error: null });
        return;
      }

      const cacheId = selection
        .map((p) => p.id)
        .sort()
        .join(",");

      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { id: string; stats: Stats };
          if (parsed.id === cacheId) {
            if (!cancelled)
              setState({ status: "ready", stats: parsed.stats, error: null });
            return;
          }
        }
      } catch {
        // ignore cache errors and refetch
      }

      try {
        const res = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playlists: selection }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "unknown" }));
          if (!cancelled) setState({ status: "error", stats: null, error });
          return;
        }
        const stats = (await res.json()) as Stats;
        if (cancelled) return;
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ id: cacheId, stats }),
          );
        } catch {
          // sessionStorage may be full; non-fatal
        }
        setState({ status: "ready", stats, error: null });
      } catch {
        if (!cancelled) {
          setState({ status: "error", stats: null, error: "network" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
