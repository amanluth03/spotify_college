import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-email",
].join(" ");

/** Exchange a refresh token for a fresh access token (Spotify token rotation). */
async function refreshAccessToken(refreshToken: string) {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw data;

  return {
    access_token: data.access_token as string,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in as number),
    // Spotify may or may not return a new refresh token; keep the old one if not.
    refresh_token: (data.refresh_token as string | undefined) ?? refreshToken,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: { scope: SCOPES },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist the tokens from the OAuth account.
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
        return token;
      }

      // Still valid (60s safety margin) — reuse.
      if (token.expires_at && Date.now() < (token.expires_at - 60) * 1000) {
        return token;
      }

      // Expired — rotate.
      if (!token.refresh_token) {
        token.error = "NoRefreshToken";
        return token;
      }
      try {
        const refreshed = await refreshAccessToken(token.refresh_token);
        token.access_token = refreshed.access_token;
        token.expires_at = refreshed.expires_at;
        token.refresh_token = refreshed.refresh_token;
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.access_token;
      session.error = token.error;
      return session;
    },
  },
});
