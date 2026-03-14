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

/** In-memory list of scores submitted during this session (so leaderboard updates after playing). */
let mockScoresCreatedThisSession: ScoreEntry[] = [];

const auth = {
  async me() {
    return {
      user: { full_name: "Demo User", email: "demo@studyquest.com" },
      isAuthenticated: true,
    };
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
    list: (_order?: string, _limit?: number): Promise<ScoreEntry[]> => {
      if (!USE_MOCK_ENTITIES) return Promise.resolve([]);
      const combined = [...mockScoresCreatedThisSession, ...MOCK_SCORES];
      combined.sort((a, b) => b.score - a.score);
      return Promise.resolve(combined);
    },
    create: (data?: Record<string, unknown>) => {
      if (USE_MOCK_ENTITIES && data) {
        const newEntry: ScoreEntry = {
          id: `mock-${Date.now()}`,
          player_name: (data.player_name as string) ?? "Anonymous",
          player_email: (data.player_email as string) ?? "",
          course_id: data.course_id as string | undefined,
          course_title: (data.course_title as string) ?? undefined,
          week_number: (data.week_number as number) ?? undefined,
          score: (data.score as number) ?? 0,
          total_questions: (data.total_questions as number) ?? undefined,
          time_taken_seconds: (data.time_taken_seconds as number) ?? undefined,
        };
        mockScoresCreatedThisSession.push(newEntry);
      }
      return Promise.resolve();
    },
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

export const api = { auth, entities, integrations };
