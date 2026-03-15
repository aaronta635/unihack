/**
 * API client for auth, entities, and integrations.
 * When USE_MOCK_ENTITIES is true, entities use test data so you can play the game without a backend.
 * Set to false and replace entity implementations with real fetch() calls when your API/DB is ready.
 */

import {
  MOCK_SCHOOLS,
  MOCK_COURSES,
  MOCK_SCORES,
} from "@/lib/testData/mockEntities";
import type { School, Course, ScoreEntry } from "@/lib/types/entities";

/** Toggle: use mock schools/courses/scores for testing. Set false when connecting to real API. */
const USE_MOCK_ENTITIES = true;

export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) return env;
  if (typeof window !== "undefined")
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  return "http://localhost:3000";
}

/** Returns headers with Bearer token when available (for authenticated API calls, e.g. admin upload). */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = getAuthStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const API_BASE = getApiBase();

const AUTH_TOKEN_KEY = "access_token";
const AUTH_REFRESH_KEY = "refresh_token";

/** Use sessionStorage so each tab/window has its own auth; avoids two tabs showing the same user. */
function getAuthStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}
function getStoredToken(): string | null {
  return getAuthStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
}
function setStoredTokens(token: string, refresh?: string): void {
  const s = getAuthStorage();
  if (!s) return;
  s.setItem(AUTH_TOKEN_KEY, token);
  if (refresh) s.setItem(AUTH_REFRESH_KEY, refresh);
}
function clearStoredAuth(): void {
  const s = getAuthStorage();
  if (!s) return;
  s.removeItem(AUTH_TOKEN_KEY);
  s.removeItem(AUTH_REFRESH_KEY);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("app_access_token");
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_REFRESH_KEY);
  }
}

/** In-memory list of scores submitted during this session (so leaderboard updates after playing). */
let mockScoresCreatedThisSession: ScoreEntry[] = [];

const auth = {
  async me(): Promise<{ user: { id?: string; email?: string; user_metadata?: { full_name?: string; display_name?: string }; [k: string]: unknown } | null; isAuthenticated: boolean }> {
    if (typeof window === "undefined") return { user: null, isAuthenticated: false };
    const token = getStoredToken();
    if (!token) return { user: null, isAuthenticated: false };
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        clearStoredAuth();
        return { user: null, isAuthenticated: false };
      }
      const json = await res.json();
      return { user: json.user ?? null, isAuthenticated: !!json.user };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  },
  async login(email: string, password: string): Promise<{ user: unknown; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { user: null, error: data.error ?? "Login failed" };
      const token = data.session?.access_token ?? data.access_token;
      const refresh = data.session?.refresh_token ?? data.refresh_token;
      if (token && typeof window !== "undefined") {
        setStoredTokens(token, refresh);
      }
      return { user: data.user ?? data };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err.message : "Login failed" };
    }
  },
  async signup(email: string, password: string, display_name?: string): Promise<{ user: unknown; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: display_name || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { user: null, error: data.error ?? "Signup failed" };
      return { user: data.user ?? data };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err.message : "Signup failed" };
    }
  },
  /** Persist Admin/Student role for the current user. Call after toggle click. */
  async updateRole(role: "admin" | "student"): Promise<{ user?: unknown; role?: string; error?: string }> {
    const token = getStoredToken();
    if (!token) return { error: "Not logged in" };
    try {
      const res = await fetch(`${API_BASE}/auth/me/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: (data as { error?: string }).error ?? "Failed to update role" };
      return { user: (data as { user?: unknown }).user, role: (data as { role?: string }).role };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update role" };
    }
  },
  logout(redirectUrl?: string) {
    if (typeof window !== "undefined") {
      clearStoredAuth();
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
  School: {
    list: (): Promise<School[]> =>
      USE_MOCK_ENTITIES
        ? Promise.resolve(MOCK_SCHOOLS)
        : Promise.resolve([]),
  },
  Course: {
    list: (): Promise<Course[]> =>
      USE_MOCK_ENTITIES
        ? Promise.resolve(MOCK_COURSES)
        : Promise.resolve([]),
    filter: (params?: { id?: string | null }): Promise<Course[]> => {
      if (!USE_MOCK_ENTITIES) return Promise.resolve([]);
      if (!params?.id) return Promise.resolve(MOCK_COURSES);
      const id = String(params.id).trim();
      const found = MOCK_COURSES.filter(
        (c) =>
          c.id === id ||
          c.id === `course-${id}` ||
          c.code === id ||
          c.code === id.toUpperCase()
      );
      return Promise.resolve(found);
    },
    update: (_id?: string, _data?: unknown) => Promise.resolve(),
  },
  Score: {
    // Always fetch from real API so dashboard and course leaderboards show DB data
    async list(_order?: string, limit = 100): Promise<ScoreEntry[]> {
      try {
        const url = `${API_BASE}/api/leaderboard?limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error("Failed to load leaderboard from API", res.status);
          return USE_MOCK_ENTITIES ? [...mockScoresCreatedThisSession, ...MOCK_SCORES].sort((a, b) => b.score - a.score) : [];
        }
      const json = await res.json();
      const rows = (json.leaderboard ?? []) as any[];
      return rows.map((r) => ({
        id: String(r.id),
        player_name: r.player_name ?? "Anonymous",
        player_email: r.player_email ?? "",
        course_id: r.course_id ?? undefined,
        course_title: r.course_title ?? undefined, // backend doesn’t have this yet; stays undefined
        week_number: r.week_number ?? undefined,
        score: r.score ?? 0,
        total_questions: r.total_questions ?? undefined,
        time_taken_seconds: r.time_taken_seconds ?? undefined,
      }));
      } catch {
        return USE_MOCK_ENTITIES ? [...mockScoresCreatedThisSession, ...MOCK_SCORES].sort((a, b) => b.score - a.score) : [];
      }
    },

    async create(data?: Record<string, unknown>) {
      if (!data) return;

      const payload = {
        player_name: data.player_name ?? "Anonymous",
        player_email: data.player_email ?? "",
        course_id: data.course_id,
        week_number: data.week_number,
        score: data.score ?? 0,
        questions_answered: data.total_questions ?? 0,
        correct_count: data.correct_count ?? 0,
      };

      const res = await fetch(`${API_BASE}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to submit score", res.status, err);
        return;
      }
      if (USE_MOCK_ENTITIES) {
        mockScoresCreatedThisSession.push({
          id: `mock-${Date.now()}`,
          player_name: (payload.player_name as string) ?? "Anonymous",
          player_email: (payload.player_email as string) ?? "",
          course_id: payload.course_id as string | undefined,
          course_title: (data.course_title as string) ?? undefined,
          week_number: payload.week_number as number | undefined,
          score: payload.score as number,
          total_questions: payload.questions_answered as number | undefined,
          time_taken_seconds: (data.time_taken_seconds as number) ?? undefined,
        });
      }
    },
  },
};

export type PlayerStats = {
  attack: number;
  defense: number;
  xp: number;
  level: number;
  stat_points: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  xp_per_level: number;
};

const stats = {
  async get(): Promise<PlayerStats | null> {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return null;
    try {
      const res = await fetch(`${API_BASE}/api/stats`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      const xp = Number(data.xp) ?? 0;
      const level = Number(data.level) ?? 0;
      const xpPerLevel = Number(data.xp_per_level) ?? 100;
      const xpInCurrent = Number(data.xp_in_current_level) ?? (xp - level * xpPerLevel);
      const xpToNext = Number(data.xp_to_next_level) ?? (xpPerLevel - xpInCurrent);
      return {
        attack: Number(data.attack) ?? 0,
        defense: Number(data.defense) ?? 0,
        xp,
        level,
        stat_points: Number(data.stat_points) ?? 0,
        xp_in_current_level: xpInCurrent,
        xp_to_next_level: xpToNext,
        xp_per_level: xpPerLevel,
      };
    } catch {
      return null;
    }
  },

  /** Spend 1 stat point on +1 Attack or +1 Defense. Returns updated stats or null. */
  async allocate(type: "attack" | "defense"): Promise<PlayerStats | null> {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return null;
    try {
      const res = await fetch(`${API_BASE}/api/stats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const xp = Number(data.xp) ?? 0;
      const level = Number(data.level) ?? 0;
      const xpPerLevel = Number(data.xp_per_level) ?? 100;
      const xpInCurrent = Number(data.xp_in_current_level) ?? 0;
      const xpToNext = Number(data.xp_to_next_level) ?? xpPerLevel;
      return {
        attack: Number(data.attack) ?? 0,
        defense: Number(data.defense) ?? 0,
        xp,
        level,
        stat_points: Number(data.stat_points) ?? 0,
        xp_in_current_level: xpInCurrent,
        xp_to_next_level: xpToNext,
        xp_per_level: xpPerLevel,
      };
    } catch {
      return null;
    }
  },
};

const integrations = {
  Core: {
    UploadFile: ({ file }: { file: File }) => {
      const url =
        typeof window !== "undefined" && file
          ? URL.createObjectURL(file)
          : "#";
      return Promise.resolve({ file_url: url });
    },
  },
};

type TutorChatMessage = { role: "user" | "assistant"; content: string };

const tutor = {
  async chat(params: {
    messages: TutorChatMessage[];
    personalityKey: string;
    lessonContext?: string;
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: params.messages,
        personalityKey: params.personalityKey,
        lessonContext: params.lessonContext ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Tutor request failed");
    }
    const data = await res.json();
    return data.reply ?? "";
  },
  async speak(params: {
    text: string;
    personalityKey?: string;
  }): Promise<Blob> {
    const res = await fetch(`${API_BASE}/tutor/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: params.text,
        personalityKey: params.personalityKey ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "TTS request failed");
    }
    return res.blob();
  },
};

export const api = { auth, entities, integrations, tutor, stats };
