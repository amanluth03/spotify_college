import { auth } from "@/auth";
import { collectLibrary } from "@/lib/spotify";
import { computeStats } from "@/lib/stats";
import { NextResponse } from "next/server";

// Collecting a big library can take a while; allow the full Fluid Compute window.
export const maxDuration = 300;

interface Body {
  playlists?: { id: string; name: string }[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.error) {
    return NextResponse.json({ error: "token_expired" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const playlists = body.playlists ?? [];
  if (playlists.length === 0) {
    return NextResponse.json({ error: "no_playlists" }, { status: 400 });
  }

  try {
    const { tracks, artists } = await collectLibrary(
      session.accessToken,
      playlists,
    );
    if (tracks.length === 0) {
      return NextResponse.json({ error: "no_tracks" }, { status: 422 });
    }
    return NextResponse.json(computeStats(tracks, artists));
  } catch (err) {
    console.error("stats error", err);
    return NextResponse.json({ error: "spotify_error" }, { status: 502 });
  }
}
