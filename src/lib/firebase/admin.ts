import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
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
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
        );
      }
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    }
    authInstance = getAuth();
  }
  return authInstance;
}
