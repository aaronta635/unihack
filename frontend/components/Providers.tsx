"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { TutorSettingsProvider } from "@/contexts/TutorSettingsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <TutorSettingsProvider>{children}</TutorSettingsProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
