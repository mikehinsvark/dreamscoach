import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { getAuth } from "@clerk/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { clerkUserUpdate } from "./clerkIdentity";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const auth = getAuth(opts.req);
  let clerkUserId = auth.isAuthenticated ? auth.userId : null;

  if (!clerkUserId) {
    const header = opts.req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (bearer && ENV.clerkSecretKey) {
      try {
        const verifiedToken = await verifyToken(bearer, {
          secretKey: ENV.clerkSecretKey,
        });
        clerkUserId = verifiedToken.sub ?? null;
      } catch (error) {
        console.warn("[Auth] Clerk bearer token verification failed", error);
      }
    }
  }

  if (clerkUserId) {
    try {
      const clerk = createClerkClient({ secretKey: ENV.clerkSecretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      const identity = clerkUserUpdate({
        clerkUserId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
      }, ENV.clerkAdminEmail);
      user = (await db.findOrAdoptClerkUser(identity)) ?? null;
    } catch (error) {
      console.error("[Auth] Clerk user synchronization failed", error);
      try {
        // The verified session itself is sufficient to create a standard rep profile.
        // Do not grant elevated access when Clerk profile enrichment is unavailable.
        user = (await db.findOrAdoptClerkUser({
          openId: clerkUserId,
          loginMethod: "clerk",
        })) ?? null;
      } catch (fallbackError) {
        console.error("[Auth] Clerk fallback user synchronization failed", fallbackError);
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
