import { NextResponse } from "next/server";
import type { FirebaseOptions } from "firebase/app";

export const dynamic = "force-dynamic";

function buildFirebaseOptions(): FirebaseOptions | null {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const projectId =
    process.env.FIREBASE_WEB_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const appId = process.env.FIREBASE_WEB_APP_ID;
  if (!apiKey || !projectId || !appId) return null;

  const options: FirebaseOptions = {
    apiKey,
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN ?? undefined,
    projectId,
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET ?? undefined,
    messagingSenderId:
      process.env.FIREBASE_WEB_MESSAGING_SENDER_ID ?? undefined,
    appId,
  };

  const databaseURL = process.env.FIREBASE_WEB_DATABASE_URL;
  if (databaseURL) options.databaseURL = databaseURL;

  const measurementId = process.env.FIREBASE_WEB_MEASUREMENT_ID;
  if (measurementId) options.measurementId = measurementId;

  return options;
}

/**
 * Served at runtime so Firebase web identifiers are not inlined into JS chunks from NEXT_PUBLIC_*.
 * Anyone who uses your deployed site can still read this response — restrict keys in GCP (HTTP referrers) and use App Check.
 */
export function GET(): NextResponse {
  const options = buildFirebaseOptions();
  if (!options) {
    return NextResponse.json(
      { error: "Firebase web config is not set on the server." },
      { status: 503 },
    );
  }
  return NextResponse.json(options, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
