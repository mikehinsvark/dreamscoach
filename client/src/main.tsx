import { trpc } from "@/lib/trpc";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { useMemo } from "react";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { getClerkAuthorizationHeader } from "./lib/clerkAuth";

const queryClient = new QueryClient();
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required");

function ClerkTrpcProvider() {
  const { getToken } = useClerkAuth();
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            headers: () => getClerkAuthorizationHeader(getToken),
            fetch(input, init) {
              return globalThis.fetch(input, {
                ...(init ?? {}),
                credentials: "include",
              });
            },
          }),
        ],
      }),
    [getToken],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <ClerkTrpcProvider />
  </ClerkProvider>
);
