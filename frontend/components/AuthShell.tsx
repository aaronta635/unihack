"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const PUBLIC_PATHS = ["/", "/Home"];

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const isPublicPage = pathname && PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (
      !isLoadingAuth &&
      !isLoadingPublicSettings &&
      authError?.type === "auth_required" &&
      !isPublicPage
    ) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError?.type, isPublicPage, navigateToLogin]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#ffe6f0]/70 backdrop-blur-md">
        <div className="w-8 h-8 border-4 border-[#ffb3c6] border-t-[#ff8fb1] rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === "user_not_registered") {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#ffe6f0]/70 backdrop-blur-md">
        <div className="text-center max-w-md">
          <p className="text-[#4a2b3e] font-semibold mb-2">User not registered</p>
          <p className="text-[#8b5a7a] text-sm">{authError.message}</p>
        </div>
      </div>
    );
  }

  if (authError?.type === "auth_required" && !isPublicPage) return null;

  return <>{children}</>;
}
