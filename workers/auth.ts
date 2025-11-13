import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

// Create auth instance factory
// IMPORTANT: In Cloudflare Workers, D1 bindings are only available within request context
// So we need to create the auth instance dynamically for each request
export function createAuth(db: D1Database) {
  const drizzleDb = drizzle(db, { schema });

  return betterAuth({
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true if you want to require email verification
    },
    socialProviders: {
      // Add OAuth providers here if needed, e.g.:
      // github: {
      //   clientId: process.env.GITHUB_CLIENT_ID!,
      //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // },
    },
    // Optional: Add session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
