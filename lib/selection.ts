// Client-side persistence of which playlists count as "college" playlists.
"use client";

export interface SelectedPlaylist {
  id: string;
  name: string;
}

const KEY = "cw:selection";

export function getSelection(): SelectedPlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SelectedPlaylist[]) : [];
  } catch {
    return [];
  }
}

export function setSelection(playlists: SelectedPlaylist[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(playlists));
}
