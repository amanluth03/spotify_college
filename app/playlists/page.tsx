import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { PlaylistPicker } from "@/components/PlaylistPicker";
import { getAllPlaylists } from "@/lib/spotify";
import { redirect } from "next/navigation";

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.accessToken || session.error) redirect("/");

  const playlists = await getAllPlaylists(session.accessToken);
  return (
    <>
      <AppHeader />
      <PlaylistPicker playlists={playlists} />
    </>
  );
}
