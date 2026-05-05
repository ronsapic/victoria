"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase/client";

/** Mirrors Firebase-hosted snippet: initialize happens lazily via shared client; this enables Analytics when supported. */
export function FirebaseAnalyticsInit() {
  useEffect(() => {
    void getFirebaseAnalytics();
  }, []);
  return null;
}
