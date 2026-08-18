import { useAuth as useClerkAuth, useClerk } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { signOut, openSignIn } = useClerk();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(clerkLoaded && isSignedIn),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [signOut, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: !clerkLoaded || (Boolean(isSignedIn) && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(isSignedIn),
    };
  }, [
    clerkLoaded,
    isSignedIn,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!clerkLoaded || isSignedIn) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      openSignIn();
    }
  }, [
    clerkLoaded,
    isSignedIn,
    openSignIn,
    redirectOnUnauthenticated,
    redirectPath,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    signIn: () => openSignIn(),
    logout,
  };
}
