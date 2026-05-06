import "server-only";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let authInstance: Auth | undefined;

/** Lazy init so `next build` can run without Firebase keys until API/auth runs. */
export function getAdminAuth(): Auth {
  if (!authInstance) {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n",
      );

      const hasExplicitCreds = !!(projectId && clientEmail && privateKey);
      const hasAdc = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (hasExplicitCreds) {
        initializeApp({
          credential: cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! }),
          projectId,
        });
      } else if (hasAdc) {
        // Uses the service account JSON pointed to by GOOGLE_APPLICATION_CREDENTIALS.
        // This is often the easiest local setup on Windows.
        initializeApp({
          credential: applicationDefault(),
          projectId: projectId,
        });
      } else {
        throw new Error(
          "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file.",
        );
      }
    }
    authInstance = getAuth();
  }
  return authInstance;
}
