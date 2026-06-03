import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.accessToken) redirect("/playlists");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* ambient gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-grape/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-spotify/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-10 h-[18rem] w-[18rem] rounded-full bg-magenta/20 blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-6 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-muted backdrop-blur">
          Your college years, in sound
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          College{" "}
          <span className="bg-gradient-to-r from-spotify-bright via-lime to-sky bg-clip-text text-transparent">
            Wrapped
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg text-muted">
          Combine all your semester playlists into one frivolous, beautiful
          recap. Top artists, the months you binged, how your taste evolved —
          the soundtrack of your time at school.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("spotify", { redirectTo: "/playlists" });
          }}
          className="mt-10"
        >
          <button
            type="submit"
            className="group inline-flex items-center gap-3 rounded-full bg-spotify px-8 py-4 text-base font-bold text-black transition-transform hover:scale-105 hover:bg-spotify-bright active:scale-100"
          >
            <SpotifyMark />
            Log in with Spotify
          </button>
        </form>

        <p className="mt-6 text-xs text-muted/70">
          Read-only access to your playlists. Nothing is stored.
        </p>
      </div>
    </main>
  );
}

function SpotifyMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.31c-.23.38-.72.5-1.1.27-3-1.84-6.79-2.26-11.24-1.24-.43.1-.86-.17-.96-.6-.1-.43.17-.86.6-.96 4.87-1.11 9.05-.63 12.42 1.43.39.23.5.72.28 1.1zm1.47-3.27c-.29.47-.91.62-1.38.33-3.44-2.11-8.68-2.72-12.75-1.49-.53.16-1.08-.14-1.24-.66-.16-.53.14-1.08.66-1.24 4.65-1.41 10.43-.73 14.37 1.69.47.29.62.91.34 1.37zm.13-3.4C15.53 8.16 8.6 7.93 4.62 9.14c-.63.19-1.3-.16-1.49-.79-.19-.63.16-1.3.79-1.49 4.57-1.39 12.23-1.12 16.55 1.45.57.34.76 1.08.42 1.65-.33.56-1.07.75-1.26.41z" />
    </svg>
  );
}
