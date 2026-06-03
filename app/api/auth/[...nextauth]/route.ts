import { authConfig } from "@/auth";
import { Auth } from "@auth/core";
import { type NextRequest } from "next/server";

// Next.js normalizes 127.0.0.1 → localhost in req.url / req.nextUrl, even when
// the Host header says 127.0.0.1. This breaks Auth.js OAuth callbacks because
// the redirect_uri in the token exchange uses req.url (localhost) while the
// authorization URL used AUTH_URL (127.0.0.1), causing Spotify to reject it.
//
// Fix: build a plain Web API Request (no Next.js normalization) with a URL
// corrected to AUTH_URL's origin, then pass it straight to @auth/core's Auth().
// authConfig is already fully initialized (basePath, secret) by NextAuth() at
// module load time, so no further setup is needed here.
async function handler(req: NextRequest) {
  const envOrigin = new URL(
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? `http://${req.headers.get("host")}`,
  ).origin;

  const fixedUrl = req.url.replace(req.nextUrl.origin, envOrigin);

  const plainReq = new Request(fixedUrl, {
    method: req.method,
    headers: req.headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: req.body, duplex: "half" }
      : {}),
  });

  return Auth(plainReq, authConfig);
}

export const GET = handler;
export const POST = handler;
