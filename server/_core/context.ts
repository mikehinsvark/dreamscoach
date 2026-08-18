import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { clerkClient, getAuth } from "@clerk/express";
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
  if (auth.isAuthenticated && auth.userId) {
    try {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
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
          openId: auth.userId,
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
