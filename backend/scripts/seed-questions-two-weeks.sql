-- Seed questions for 2 weeks (course-comp2000). Run in Supabase SQL Editor.
-- Optional: clear existing for this course first:
-- DELETE FROM questions WHERE course_id = 'course-comp2000';

INSERT INTO questions (title, choice1, choice2, choice3, choice4, answer, course_id, week_number)
VALUES
-- Week 1
('What is the time complexity of binary search on a sorted array of n elements?', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 2, 'course-comp2000', 1),
('Which data structure uses LIFO (Last In, First Out)?', 'Queue', 'Stack', 'Array', 'Linked List', 2, 'course-comp2000', 1),
('In a binary tree, what is the maximum number of nodes at level k?', 'k', '2k', '2^k', 'k²', 3, 'course-comp2000', 1),
-- Week 2
('Which sorting algorithm has O(n log n) average time complexity?', 'Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort', 3, 'course-comp2000', 2),
('What does HTTP stand for?', 'HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Protocol', 'High Text Transfer Protocol', 1, 'course-comp2000', 2);
