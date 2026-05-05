"use client";

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

let firebaseAppPromise: Promise<FirebaseApp> | null = null;

async function fetchFirebaseOptions(): Promise<FirebaseOptions> {
  const res = await fetch("/api/firebase-config", { method: "GET" });
  if (!res.ok) {
    throw new Error("Failed to load Firebase configuration.");
  }
  const options = (await res.json()) as FirebaseOptions & {
    error?: string;
  };
  if ("error" in options && typeof options.error === "string") {
    throw new Error(options.error);
  }
  if (!options.apiKey || !options.projectId) {
    throw new Error("Invalid Firebase configuration.");
  }
  return options;
}

async function resolveFirebaseApp(): Promise<FirebaseApp> {
  if (typeof window === "undefined") {
    throw new Error("Firebase client must run in the browser.");
  }
  if (getApps().length > 0) return getApp();

  if (!firebaseAppPromise) {
    firebaseAppPromise = (async () => {
      const config = await fetchFirebaseOptions();
      return initializeApp(config);
    })().catch((err) => {
      firebaseAppPromise = null;
      throw err;
    });
  }
  return firebaseAppPromise;
}

export async function getFirebaseAuth(): Promise<Auth> {
  const app = await resolveFirebaseApp();
  return getAuth(app);
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  const app = await resolveFirebaseApp();
  if (!(await isSupported())) return null;
  if (!app.options.measurementId) return null;
  return getAnalytics(app);
}
