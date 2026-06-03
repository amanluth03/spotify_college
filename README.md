# College Wrapped 🎓🎧

A personal "Spotify Wrapped" for your college **semester playlists**. Log in with
Spotify, pick the playlists you made each semester, and get a combined recap:
top artists & tracks, when you added songs, how your taste evolved, and a pile of
frivolous superlatives — plus an animated, swipeable Wrapped story.

Built with Next.js (App Router), Auth.js, Recharts, and Motion. Deploys to Vercel.

---

## What you get

- **Dashboard** — top artists/tracks, a songs-added timeline, per-semester totals,
  a genre donut, and superlatives (longest/shortest song, deepest cut, the song you
  re-added across the most semesters, one-hit wonders, oldest throwback, busiest day…).
- **▶ Play my Wrapped** — full-screen animated story cards that reveal each stat,
  with tap / swipe / arrow-key navigation.

> ℹ️ Spotify deprecated the **audio-features** endpoint (danceability / energy /
> "mood") for newly-registered apps in late 2024, so those stats aren't included.
> Everything here uses still-supported data: added dates, artist genres, popularity,
> duration, and release year.

---

## 1. Create a Spotify app (one time, ~3 min)

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   and **Create app**.
2. Add these **Redirect URIs** (Spotify requires the loopback IP `127.0.0.1`, not
   `localhost`):
   - `http://127.0.0.1:3000/api/auth/callback/spotify` — local dev
   - `https://<your-domain>.vercel.app/api/auth/callback/spotify` — add after you deploy
3. Under **APIs used**, select **Web API**.
4. Copy the **Client ID** and **Client Secret**.

Development Mode is fine — your own Spotify account always has access.

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
SPOTIFY_CLIENT_ID=...        # from the Spotify dashboard
SPOTIFY_CLIENT_SECRET=...    # from the Spotify dashboard
AUTH_SECRET=...              # already generated for you; or: openssl rand -base64 32
```

## 3. Run it

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:3000** (use `127.0.0.1`, **not** `localhost`, so the OAuth
redirect matches what you registered).

Flow: **Log in with Spotify → tick your semester playlists → Build my Wrapped**.

---

## Deploy to Vercel

```bash
npm i -g vercel        # if you don't have it
vercel                 # first run links/creates the project
```

Then set the environment variables (Production + Preview):

```bash
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel env add AUTH_SECRET
vercel --prod
```

Finally, in the Spotify dashboard add the production redirect URI:
`https://<your-domain>.vercel.app/api/auth/callback/spotify`

Auth.js infers the URL from the request host, so no `AUTH_URL` is needed on Vercel.

---

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server                 |
| `npm run build` | Production build                     |
| `npm test`      | Run the stat-function unit tests     |
| `npm run lint`  | Lint                                 |

---

## How it works

- `auth.ts` — Auth.js v5 with the Spotify provider and refresh-token rotation.
- `lib/spotify.ts` — server-side Spotify client (auto-paginates playlists & tracks,
  batches artist lookups, handles rate limits). Tokens never reach the browser.
- `lib/stats.ts` — pure, unit-tested functions that turn collected tracks into the
  full stats bundle. Each selected playlist is treated as one "semester".
- `app/api/stats` — collects the library for the chosen playlists and computes stats.
- `components/DashboardClient.tsx` / `components/WrappedClient.tsx` — the two views.
