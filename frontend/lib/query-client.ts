import { QueryClient } from "@tanstack/react-query";

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
