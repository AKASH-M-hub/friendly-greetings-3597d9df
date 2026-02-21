-- =============================================
-- SEED MCQ QUESTIONS
-- Sample questions for testing the MCQ quiz system
-- =============================================

-- Programming Questions
INSERT INTO public.mcq_questions (topic, skill_level, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty_score, is_active) VALUES
('JavaScript Basics', 'beginner', 'What keyword is used to declare a variable in JavaScript that can be reassigned?', 'const', 'let', 'var', 'Both B and C', 'D', 'Both "let" and "var" allow reassignment. "const" declares constants that cannot be reassigned.', 2, true),
('React Hooks', 'intermediate', 'Which React Hook is used to perform side effects in function components?', 'useState', 'useEffect', 'useContext', 'useMemo', 'B', 'useEffect is specifically designed for side effects like data fetching, subscriptions, or manually changing the DOM.', 3, true),
('TypeScript Types', 'intermediate', 'What TypeScript feature allows you to define a type that can be one of several types?', 'Interface', 'Union Type', 'Enum', 'Generic', 'B', 'Union types (using the | operator) allow a value to be one of several types, e.g., string | number.', 3, true),
('CSS Flexbox', 'beginner', 'Which CSS property is used to center items along the main axis in a flex container?', 'align-items', 'justify-content', 'flex-direction', 'align-content', 'B', 'justify-content centers items along the main axis, while align-items works on the cross axis.', 2, true),
('Database SQL', 'intermediate', 'Which SQL clause is used to filter records after grouping?', 'WHERE', 'FILTER', 'HAVING', 'GROUP BY', 'C', 'HAVING is used to filter grouped records, while WHERE filters individual rows before grouping.', 3, true);

-- Math Questions
INSERT INTO public.mcq_questions (topic, skill_level, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty_score, is_active) VALUES
('Algebra', 'beginner', 'What is the value of x in the equation: 2x + 5 = 15?', 'x = 5', 'x = 10', 'x = 7.5', 'x = 2.5', 'A', 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5.', 2, true),
('Geometry', 'beginner', 'What is the sum of interior angles in a triangle?', '90 degrees', '180 degrees', '270 degrees', '360 degrees', 'B', 'The sum of all interior angles in any triangle is always 180 degrees.', 1, true),
('Calculus', 'advanced', 'What is the derivative of x² with respect to x?', 'x', '2x', 'x²', '2', 'B', 'Using the power rule: d/dx(x^n) = n·x^(n-1), so d/dx(x²) = 2x.', 3, true),
('Statistics', 'intermediate', 'What measure of central tendency is most affected by outliers?', 'Mean', 'Median', 'Mode', 'Range', 'A', 'The mean is strongly affected by outliers because it uses all values. Median is more resistant to outliers.', 3, true),
('Probability', 'intermediate', 'What is the probability of rolling a 6 on a fair six-sided die?', '1/2', '1/3', '1/6', '1/12', 'C', 'A fair die has 6 equally likely outcomes, so the probability of any single outcome is 1/6.', 2, true);

-- Science Questions
INSERT INTO public.mcq_questions (topic, skill_level, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty_score, is_active) VALUES
('Physics', 'beginner', 'What is the SI unit of force?', 'Joule', 'Watt', 'Newton', 'Pascal', 'C', 'The Newton (N) is the SI unit of force, defined as kg·m/s².', 1, true),
('Chemistry', 'intermediate', 'What is the pH of a neutral solution at 25°C?', '0', '7', '14', '1', 'B', 'A neutral solution has a pH of 7, where [H+] equals [OH-]. Values below 7 are acidic, above 7 are basic.', 2, true),
('Biology', 'beginner', 'What organelle is known as the powerhouse of the cell?', 'Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus', 'B', 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.', 1, true),
('Astronomy', 'intermediate', 'Which planet in our solar system has the most moons?', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'B', 'Saturn has over 80 confirmed moons, more than any other planet in our solar system (as of recent counts).', 3, true),
('Earth Science', 'beginner', 'What type of rock is formed from cooled magma or lava?', 'Sedimentary', 'Metamorphic', 'Igneous', 'Fossiliferous', 'C', 'Igneous rocks form from the cooling and solidification of molten rock material (magma or lava).', 2, true);

-- General Knowledge
INSERT INTO public.mcq_questions (topic, skill_level, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty_score, is_active) VALUES
('World History', 'intermediate', 'In which year did World War II end?', '1943', '1944', '1945', '1946', 'C', 'World War II ended in 1945 with Germany surrendering in May and Japan in September.', 2, true),
('Geography', 'beginner', 'What is the largest continent by land area?', 'Africa', 'Asia', 'North America', 'Europe', 'B', 'Asia is the largest continent, covering approximately 44.58 million km² (about 30% of Earth''s land).', 1, true),
('Literature', 'intermediate', 'Who wrote "To Kill a Mockingbird"?', 'Harper Lee', 'Mark Twain', 'Ernest Hemingway', 'F. Scott Fitzgerald', 'A', 'Harper Lee wrote this classic novel published in 1960, which won the Pulitzer Prize.', 2, true),
('Music Theory', 'beginner', 'How many keys are on a standard piano?', '76', '88', '96', '104', 'B', 'A standard piano has 88 keys: 52 white keys and 36 black keys.', 1, true),
('Business', 'intermediate', 'What does ROI stand for in business?', 'Rate of Interest', 'Return on Investment', 'Risk of Insolvency', 'Revenue over Income', 'B', 'ROI (Return on Investment) measures the profitability of an investment relative to its cost.', 2, true);
