/**
 * API client for auth, entities, and integrations.
 * Stub implementation — replace with real backend (REST, etc.) when your DB is ready.
 */

const auth = {
  async me() {
    throw Object.assign(new Error("Not authenticated"), { status: 401 });
  },
  logout(redirectUrl?: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("app_access_token");
      window.localStorage.removeItem("access_token");
      if (redirectUrl) window.location.href = redirectUrl;
    }
  },
  redirectToLogin(returnUrl?: string) {
    if (typeof window !== "undefined") {
      const loginUrl = process.env.NEXT_PUBLIC_APP_LOGIN_URL || "/";
      window.location.href = returnUrl
        ? `${loginUrl}?return_url=${encodeURIComponent(returnUrl)}`
        : loginUrl;
    }
  },
};

const entities = {
  School: { list: () => Promise.resolve([]) },
  Course: {
    list: () => Promise.resolve([]),
    filter: (_params?: { id?: string | null }) => Promise.resolve([]),
    update: (_id?: string, _data?: unknown) => Promise.resolve(),
  },
  Score: {
    list: (_order?: string, _limit?: number) => Promise.resolve([]),
    create: (_data?: Record<string, unknown>) => Promise.resolve(),
  },
};

const integrations = {
  Core: {
    UploadFile: ({ file }: { file: File }) => {
      const url =
        typeof window !== "undefined" && file ? URL.createObjectURL(file) : "#";
      return Promise.resolve({ file_url: url });
    },
  },
};

export const api = { auth, entities, integrations };
