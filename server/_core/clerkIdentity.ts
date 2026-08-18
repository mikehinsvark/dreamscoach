import type { User } from "../../drizzle/schema";

export type ClerkIdentityInput = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
};

export function clerkDisplayName(identity: ClerkIdentityInput) {
  const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim();
  return fullName || identity.username || identity.email || "Prospect Member";
}

export function isConfiguredClerkAdmin(email: string | null, adminEmail: string) {
  return Boolean(email && adminEmail && email.trim().toLowerCase() === adminEmail.trim().toLowerCase());
}

export function clerkUserUpdate(identity: ClerkIdentityInput, adminEmail: string): Partial<User> & Pick<User, "openId"> {
  return {
    openId: identity.clerkUserId,
    name: clerkDisplayName(identity),
    email: identity.email,
    loginMethod: "clerk",
    ...(isConfiguredClerkAdmin(identity.email, adminEmail) ? { role: "admin" as const } : {}),
    lastSignedIn: new Date(),
  };
}
