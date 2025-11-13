import { createAuthClient } from "better-auth/react";

// Create the BetterAuth client for the frontend (React)
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

// Export the auth client and its methods
export const { signIn, signUp, signOut, useSession } = authClient;
