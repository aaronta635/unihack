/**
 * Mock entity data for testing StudyQuest without a backend.
 * Naming: MOCK_* so it is easy to find and remove when connecting to a real API/DB.
 * Import and use via api client when USE_MOCK_ENTITIES is true.
 */

import type { School, Course, ScoreEntry, McqQuestion } from "@/lib/types/entities";

/** Mock schools for Dashboard dropdown. */
export const MOCK_SCHOOLS: School[] = [
  { id: "school-uq", name: "University of Queensland", code: "UQ" },
  { id: "school-usyd", name: "University of Sydney", code: "USYD" },
  { id: "school-melb", name: "University of Melbourne", code: "MELB" },
];

/** Mock MCQ questions for Week 1 of the demo course (reusable shape for game). */
const MOCK_QUESTIONS_WEEK_1: McqQuestion[] = [
  {
    question: "What is the time complexity of binary search on a sorted array of n elements?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct_index: 1,
  },
  {
    question: "Which data structure uses LIFO (Last In, First Out)?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correct_index: 1,
  },
  {
    question: "In a binary tree, what is the maximum number of nodes at level k?",
    options: ["k", "2k", "2^k", "k²"],
    correct_index: 2,
  },
];

/** Mock MCQ questions for Week 2 of the demo course. */
const MOCK_QUESTIONS_WEEK_2: McqQuestion[] = [
  {
    question: "Which sorting algorithm has O(n log n) average time complexity?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
    correct_index: 2,
  },
  {
    question: "What does HTTP stand for?",
    options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyper Transfer Text Protocol", "High Text Transfer Protocol"],
    correct_index: 0,
  },
];

/** Mock courses with weeks and questions; school_id links to MOCK_SCHOOLS. */
export const MOCK_COURSES: Course[] = [
  {
    id: "course-comp2100",
    code: "COMP2100",
    title: "Data Structures & Algorithms",
    school_id: "school-usyd",
    weeks: [
      { week_number: 1, title: "Week 1", questions: MOCK_QUESTIONS_WEEK_1 },
      { week_number: 2, title: "Week 2", questions: MOCK_QUESTIONS_WEEK_2 },
    ],
  },
  {
    id: "course-comp2120",
    code: "COMP2120",
    title: "Discrete Mathematics",
    school_id: "school-usyd",
    weeks: [
      { week_number: 1, title: "Week 1", questions: [...MOCK_QUESTIONS_WEEK_1].slice(0, 2) },
    ],
  },
  {
    id: "course-comp2000",
    code: "COMP2000",
    title: "Intro to Programming",
    school_id: "school-uq",
    weeks: [
      { week_number: 1, title: "Week 1", questions: MOCK_QUESTIONS_WEEK_1 },
    ],
  },
];

/** Mock leaderboard scores for testing Dashboard leaderboard. */
export const MOCK_SCORES: ScoreEntry[] = [
  { id: "s1", player_name: "Demo User", course_title: "COMP2100", week_number: 1, score: 30, total_questions: 3 },
  { id: "s2", player_name: "Alice", course_title: "COMP2100", week_number: 1, score: 20, total_questions: 3 },
  { id: "s3", player_name: "Bob", course_title: "COMP2120", week_number: 1, score: 20, total_questions: 2 },
];
