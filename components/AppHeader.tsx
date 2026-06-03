import { signOut } from "@/auth";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-bg/80 px-5 py-3 backdrop-blur sm:px-8">
      <Link href="/playlists" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="text-spotify-bright">●</span> College Wrapped
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/playlists"
          className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
        >
          Playlists
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
          >
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
