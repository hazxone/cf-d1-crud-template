import { createAuthClient } from "better-auth/client";

// Create the BetterAuth client for the frontend
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

// Export the auth client and its methods
export const { signIn, signUp, signOut, useSession } = authClient;
