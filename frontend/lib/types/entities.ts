/**
 * Shared entity types for StudyQuest.
 * Used by mock data, API client, and components so we can swap mock/real backend without changing shapes.
 */

/** Single choice in an MCQ (display text). */
export type McqOption = string;

/** One multiple-choice question (used in game checkpoints and QuestionPop). */
export type McqQuestion = {
  question: string;
  options: McqOption[];
  correct_index: number;
};

/** Week within a course (has week number and optional questions). */
export type CourseWeek = {
  week_number: number;
  title?: string;
  tutorial_url?: string;
  questions?: McqQuestion[];
};

/** Course belongs to a school; has weeks and MCQ questions per week. */
export type Course = {
  id: string;
  code: string;
  title: string;
  school_id?: string;
  weeks?: CourseWeek[];
};

/** School / university (used in Dashboard selector). */
export type School = {
  id: string;
  name: string;
  code?: string;
  logo_url?: string;
};

/** Leaderboard / score entry (submitted after game complete). */
export type ScoreEntry = {
  id: string;
  player_name: string;
  player_email?: string;
  course_id?: string;
  course_title?: string;
  week_number?: number;
  score: number;
  total_questions?: number;
  time_taken_seconds?: number;
};
