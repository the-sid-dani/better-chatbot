import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { pgDb } from "lib/db/pg/db.pg";
import { headers } from "next/headers";
import { toast } from "sonner";
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { getAuthConfig } from "./config";

import logger from "logger";
import { redirect } from "next/navigation";

const {
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

export const auth = betterAuth({
  plugins: [nextCookies()],
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  trustedOrigins: ["http://localhost:3000", "https://localhost:3000"],
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserSchema,
      session: SessionSchema,
      account: AccountSchema,
      verification: VerificationSchema,
    },
  }),
  emailAndPassword: {
    enabled: emailAndPasswordEnabled,
    disableSignUp: !signUpEnabled,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },

  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
  socialProviders: {
    ...socialAuthenticationProviders,
    google: socialAuthenticationProviders.google
      ? {
          ...socialAuthenticationProviders.google,
          mapProfileToUser: (profile: any) => {
            // Restrict to Samba domain
            if (!profile.email?.endsWith("@sambatv.com")) {
              throw new Error("Access restricted to Samba employees");
            }
            return {
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            };
          },
        }
      : undefined,
  },
});

export const getSession = async () => {
  "use server";
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });
  if (!session) {
    logger.error("No session found");
    redirect("/sign-in");
  }
  return session!;
};

export const getEnhancedSession = async () => {
  "use server";
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });

  if (!session?.user?.id) return null;

  // Query user role from database
  const user = await pgDb
    .select({
      role: UserSchema.role,
      email: UserSchema.email,
    })
    .from(UserSchema)
    .where(eq(UserSchema.id, session.user.id))
    .limit(1);

  // Verify Samba domain (double-check)
  if (user[0]?.email && !user[0].email.endsWith("@sambatv.com")) {
    throw new Error("Access restricted to Samba employees");
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user[0]?.role || "user",
    },
  };
};
