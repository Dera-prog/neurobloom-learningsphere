export type Audience = 'junior' | 'senior' | 'special' | 'teacher' | 'parent' | 'admin'
export type ChildId = 'tunde' | 'chidi'
export type PlanId = 'general' | 'premium' | 'premium_plus' | 'special'
export type AssignmentStatus = 'pending' | 'submitted' | 'graded'

export interface Question {
  q: string
  options: string[]
  correct: number
  explain?: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  subjectColor: string
  points: number
  dueDate: string
  dueLabel: string
  type: string
  description: string
  instructions?: string
  questions?: Question[]
  autoGrade: boolean
  status: AssignmentStatus
  score?: number
  feedback?: string
  submittedAt?: string
  stage: 'junior' | 'senior'
  attachmentName?: string
  answerText?: string
}

export interface ChatMessage {
  id: string
  author: string
  text: string
  time: string
  mine?: boolean
  avatar?: string
  staff?: boolean
}

export interface Thread {
  id: string
  audience: Audience
  title: string
  subtitle: string
  emoji: string
  unread?: number
  pinned?: string
  messages: ChatMessage[]
}

export interface Tutor {
  id: string
  name: string
  emoji: string
  subjects: string[]
  rating: number
  reviews: number
  rate: number
  experience: string
  availability: string[]
  accent: string
  soft: string
  specialNeeds?: boolean
}

export interface Booking {
  id: string
  tutorName: string
  tutorEmoji: string
  subject: string
  when: string
  rate: number
  audience: 'senior' | 'parent'
  status: 'upcoming' | 'completed'
  child?: ChildId
  notes?: string
}

export interface TutorRequest {
  id: string
  student: string
  level: string
  topic: string
  rate: number
  specialist?: boolean
}

export interface AcceptedSession {
  id: string
  student: string
  level: string
  topic: string
  rate: number
  when: string
  status: string
}

export interface GradingItem {
  id: string
  assignmentId?: string
  title: string
  context: string
  student: string
  submitted: string
  total: number
}

export interface TeacherClass {
  id: string
  name: string
  level: string
  subject: string
  color: string
  soft: string
  students: number
  time: string
  duration: string
  status: 'live' | 'next' | 'upcoming'
}

export interface StudentRecord {
  id: string
  name: string
  level: string
  emoji: string
  average: number
  attendance: number
  trend: number
  support?: string
}

export interface Resource {
  id: string
  title: string
  type: 'PDF' | 'DOC' | 'VIDEO' | 'AUDIO'
  subject: string
  size: string
  downloads: number
  category: string
  addedBy: string
  status?: string
  views?: number
}

export interface Activity {
  id: string
  title: string
  minutes: number
  tag: string
  color: string
  soft: string
  emoji: string
  description: string
  steps: string[]
  reward: number
}

export interface Award {
  id: string
  title: string
  emoji: string
  earned: string | null
  description: string
  color: string
}

export interface AlertItem {
  id: string
  text: string
  time: string
  tone: 'warn' | 'good' | 'info'
  child: ChildId
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  tagline: string
  features: string[]
  accent: string
  popular?: boolean
}

export interface ChildProfile {
  id: ChildId
  name: string
  level: string
  emoji: string
  color: string
  soft: string
  plan: PlanId
  average: number
  averageLabel: string
  averageTrend: string
  attendance: number
  attendanceLabel: string
  workDone: string
  workLabel: string
  streak: string
  streakLabel: string
  lessonCompletion: Array<{ name: string; value: number; color: string }>
  grades: Array<{ code: string; subject: string; grade: string; teacher: string; score: number; color: string }>
  trend: Array<{ label: string; score: number; classAvg: number }>
  special?: boolean
}

export interface ReportEntry {
  id: string
  child: string
  category: string
  detail: string
  at: string
  status: string
}

export const STUDENT = {
  junior: {
    name: 'Tunde Bakare',
    level: 'JSS2',
    emoji: '🐯',
    points: 1180,
    streak: 7,
  },
  senior: {
    name: 'Amaka Achebe',
    level: 'SSS3',
    track: 'Science',
    initials: 'AA',
  },
  special: {
    name: 'Chidi Eze',
    age: 13,
    support: 'ASD Support',
    emoji: '🦋',
  },
  teacher: {
    name: 'Dr. Kelechi Azu',
    subject: 'Mathematics',
    rating: 4.9,
    reviews: 142,
    initials: 'KA',
  },
  parent: {
    name: 'Mrs. Ngozi Bakare',
    initials: 'NB',
  },
}

export const juniorSubjects = [
  { id: 'maths', name: 'Mathematics', short: 'MAT', emoji: '🔢', color: '#6c3fc5', soft: '#f0eefb', progress: 78, grade: 'A', teacher: 'Mr. Adeyemi' },
  { id: 'english', name: 'English', short: 'ENG', emoji: '📖', color: '#0ea5e9', soft: '#e8f4fd', progress: 85, grade: 'A+', teacher: 'Mrs. Okafor' },
  { id: 'science', name: 'Basic Science', short: 'BAS', emoji: '🔬', color: '#10b981', soft: '#ecfdf5', progress: 62, grade: 'B+', teacher: 'Mr. Ibrahim' },
  { id: 'social', name: 'Social Studies', short: 'SOC', emoji: '🌍', color: '#f59e0b', soft: '#fffbeb', progress: 70, grade: 'A-', teacher: 'Mrs. Bello' },
  { id: 'arts', name: 'Fine Arts', short: 'ART', emoji: '🎨', color: '#ec4899', soft: '#fdf2f8', progress: 90, grade: 'A+', teacher: 'Ms. Ada' },
  { id: 'music', name: 'Music', short: 'MUS', emoji: '🎵', color: '#8b5cf6', soft: '#f5f3ff', progress: 55, grade: 'B', teacher: 'Mr. Tayo' },
]

export const seniorSubjects = [
  { id: 'maths', name: 'Mathematics', code: 'MAT', grade: 'A', score: 88, color: '#6c3fc5', soft: '#f0eefb', teacher: 'Mr. Adeyemi' },
  { id: 'english', name: 'English Language', code: 'ENG', grade: 'A+', score: 84, color: '#0ea5e9', soft: '#e8f4fd', teacher: 'Mrs. Okafor' },
  { id: 'physics', name: 'Physics', code: 'PHY', grade: 'B+', score: 76, color: '#10b981', soft: '#ecfdf5', teacher: 'Dr. Azu' },
  { id: 'chemistry', name: 'Chemistry', code: 'CHE', grade: 'B', score: 72, color: '#f59e0b', soft: '#fffbeb', teacher: 'Mrs. Balogun' },
  { id: 'biology', name: 'Biology', code: 'BIO', grade: 'A-', score: 81, color: '#ec4899', soft: '#fdf2f8', teacher: 'Mr. Nnamdi' },
  { id: 'government', name: 'Government', code: 'GOV', grade: 'A', score: 86, color: '#8b5cf6', soft: '#f5f3ff', teacher: 'Mrs. Bello' },
]

const waec = (() => {
  const now = new Date()
  const year = now.getMonth() > 4 ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(year, 4, 4)
})()

function isoPlus(days: number, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function due(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000)
  if (diff <= 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff <= 6) return `Due ${d.toLocaleDateString('en-GB', { weekday: 'short' })}`
  return `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

export const algebraQuestions: Question[] = [
  { q: 'Solve for x: 2x + 5 = 17', options: ['x = 4', 'x = 6', 'x = 11', 'x = 12'], correct: 1 },
  { q: 'Simplify: 3(x + 4) − 2x', options: ['x + 12', '5x + 12', 'x + 4', '3x + 2'], correct: 0 },
  { q: 'If x = 4, what is the value of 2x² − 3?', options: ['13', '29', '61', '39'], correct: 1 },
]

export const calculusQuestions: Question[] = [
  { q: 'Differentiate y = x³', options: ['3x²', 'x²', '3x', 'x⁴⁄4'], correct: 0 },
  { q: 'What is ∫ 2x dx?', options: ['2x + C', 'x² + C', '2x² + C', 'x + C'], correct: 1 },
  { q: 'Differentiate y = sin x', options: ['−sin x', 'cos x', '−cos x', 'tan x'], correct: 1 },
  { q: 'If f(x) = 3x² + 2x, find f′(x)', options: ['6x + 2', '3x + 2', '6x² + 2x', '5x'], correct: 0 },
  { q: 'Evaluate lim(x→1) (x² − 1)/(x − 1)', options: ['0', '1', '2', 'Undefined'], correct: 2 },
]

export const examQuestions: Record<string, Question[]> = {
  'maths-paper': [
    { q: 'Simplify (2/3) ÷ (4/9)', options: ['1/2', '3/2', '8/27', '2/3'], correct: 1 },
    { q: 'The mean of 4, 7, x and 11 is 8. Find x.', options: ['8', '10', '12', '9'], correct: 1 },
    { q: 'A trader bought an item for ₦2,500 and sold it for ₦3,000. Find the profit percentage.', options: ['15%', '20%', '25%', '16.7%'], correct: 1 },
    { q: 'If log₁₀ 2 = 0.3010, find log₁₀ 8.', options: ['0.6020', '0.9030', '1.2040', '0.4515'], correct: 1 },
    { q: 'Solve the simultaneous equations: x + y = 7, x − y = 3.', options: ['x = 5, y = 2', 'x = 4, y = 3', 'x = 6, y = 1', 'x = 2, y = 5'], correct: 0 },
  ],
  'english-paper': [
    { q: 'Choose the option nearest in meaning to “benevolent”.', options: ['Cruel', 'Kind', 'Careless', 'Wealthy'], correct: 1 },
    { q: 'Identify the correct sentence.', options: ['He don’t like reading.', 'He doesn’t likes reading.', 'He doesn’t like reading.', 'He not like reading.'], correct: 2 },
    { q: 'The word “quickly” is an example of a…', options: ['Noun', 'Adverb', 'Adjective', 'Pronoun'], correct: 1 },
    { q: 'Choose the correct plural of “criterion”.', options: ['Criterions', 'Criteria', 'Criterias', 'Criterion'], correct: 1 },
    { q: '“The pen is mightier than the sword” is an example of…', options: ['Simile', 'Metaphor', 'Personification', 'Irony'], correct: 1 },
  ],
  'physics-paper': [
    { q: 'The SI unit of force is the…', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 1 },
    { q: 'A car accelerates from rest at 2 m/s². Its speed after 5 seconds is…', options: ['5 m/s', '10 m/s', '15 m/s', '20 m/s'], correct: 1 },
    { q: 'Which of these is a vector quantity?', options: ['Mass', 'Speed', 'Velocity', 'Temperature'], correct: 2 },
    { q: 'The resistance of a conductor increases when…', options: ['Temperature decreases', 'Length decreases', 'Temperature increases', 'Area increases'], correct: 2 },
    { q: 'The work done when a force of 10 N moves an object 3 m is…', options: ['3 J', '10 J', '30 J', '300 J'], correct: 2 },
  ],
}

export const initialAssignments: Assignment[] = [
  {
    id: 'a1',
    title: 'Algebra – Chapter 5 Exercises',
    subject: 'Maths',
    subjectColor: '#6c3fc5',
    points: 20,
    dueDate: isoPlus(0),
    dueLabel: due(0),
    type: 'Quiz',
    description: 'Three quick questions on solving equations and substitution from Chapter 5.',
    instructions: 'Answer all three questions. You have one attempt. Your score is added to your total points immediately.',
    questions: algebraQuestions,
    autoGrade: true,
    status: 'pending',
    stage: 'junior',
  },
  {
    id: 'a2',
    title: 'Essay: My Cultural Heritage',
    subject: 'English',
    subjectColor: '#0ea5e9',
    points: 30,
    dueDate: isoPlus(1),
    dueLabel: due(1),
    type: 'Essay',
    description: 'Write a 250–300 word essay about a tradition or festival in your community.',
    instructions: 'Include an introduction, two body paragraphs and a conclusion. Use at least three descriptive words. You can type your essay or attach a document.',
    autoGrade: false,
    status: 'pending',
    stage: 'junior',
  },
  {
    id: 'a3',
    title: 'Lab Report – Plant Cells',
    subject: 'Science',
    subjectColor: '#10b981',
    points: 25,
    dueDate: isoPlus(3),
    dueLabel: due(3),
    type: 'Lab Report',
    description: 'Write up the onion cell practical: aim, apparatus, method, observation and conclusion.',
    instructions: 'Attach your labelled diagram if you drew one. Submit a PDF or type your report below.',
    autoGrade: false,
    status: 'pending',
    stage: 'junior',
  },
  {
    id: 'a4',
    title: 'Fractions Worksheet',
    subject: 'Maths',
    subjectColor: '#6c3fc5',
    points: 15,
    dueDate: isoPlus(-3),
    dueLabel: 'Graded',
    type: 'Worksheet',
    description: 'Adding, subtracting and simplifying fractions.',
    autoGrade: false,
    status: 'graded',
    score: 14,
    feedback: 'Excellent work, Tunde! You only lost a mark on question 7 — remember to simplify your final answer.',
    stage: 'junior',
  },
  {
    id: 'a5',
    title: 'Book Review: The Bottled Leopard',
    subject: 'English',
    subjectColor: '#0ea5e9',
    points: 20,
    dueDate: isoPlus(-1),
    dueLabel: 'Submitted',
    type: 'Essay',
    description: 'Review the class novel and share what you liked most about the main character.',
    autoGrade: false,
    status: 'submitted',
    submittedAt: 'Yesterday',
    stage: 'junior',
  },
  {
    id: 'a6',
    title: 'States of Matter Quiz',
    subject: 'Science',
    subjectColor: '#10b981',
    points: 20,
    dueDate: isoPlus(-6),
    dueLabel: 'Graded',
    type: 'Quiz',
    description: 'Solids, liquids and gases.',
    autoGrade: true,
    status: 'graded',
    score: 18,
    feedback: 'Great understanding of particle arrangement. Review condensation before the next test.',
    stage: 'junior',
  },
  {
    id: 's1',
    title: 'Integration & Differentiation – Calculus',
    subject: 'Mathematics',
    subjectColor: '#6c3fc5',
    points: 40,
    dueDate: isoPlus(0),
    dueLabel: due(0),
    type: 'Problem Set',
    description: 'Five WAEC-style calculus questions covering differentiation, integration and limits.',
    instructions: 'Work without a calculator. Show your steps in your notebook before answering.',
    questions: calculusQuestions,
    autoGrade: true,
    status: 'pending',
    stage: 'senior',
  },
  {
    id: 's2',
    title: 'Essay: Democracy in Africa',
    subject: 'Government',
    subjectColor: '#8b5cf6',
    points: 30,
    dueDate: isoPlus(3),
    dueLabel: due(3),
    type: 'Essay',
    description: 'Discuss the strengths and weaknesses of democratic governance in post-colonial Africa.',
    instructions: 'Aim for 500 words. Use at least two country examples and reference the concepts from Chapter 8.',
    autoGrade: false,
    status: 'pending',
    stage: 'senior',
  },
  {
    id: 's3',
    title: 'Titration Lab Report',
    subject: 'Chemistry',
    subjectColor: '#f59e0b',
    points: 25,
    dueDate: isoPlus(2),
    dueLabel: due(2),
    type: 'Lab Report',
    description: 'Write the full report for the acid-base titration practical.',
    autoGrade: false,
    status: 'pending',
    stage: 'senior',
  },
  {
    id: 's4',
    title: 'Comprehension & Summary',
    subject: 'English',
    subjectColor: '#0ea5e9',
    points: 30,
    dueDate: isoPlus(-2),
    dueLabel: 'Graded',
    type: 'Test',
    description: 'Comprehension passage and summary exercise.',
    autoGrade: false,
    status: 'graded',
    score: 28,
    feedback: '92% — very strong summary. Watch your punctuation in the short-answer section.',
    stage: 'senior',
  },
  {
    id: 's5',
    title: 'Physics Practical Write-up',
    subject: 'Physics',
    subjectColor: '#10b981',
    points: 25,
    dueDate: isoPlus(-1),
    dueLabel: 'Submitted',
    type: 'Lab Report',
    description: 'Write-up for the simple pendulum practical.',
    autoGrade: false,
    status: 'submitted',
    submittedAt: 'Yesterday',
    stage: 'senior',
  },
  {
    id: 's6',
    title: 'Organic Chemistry Quiz',
    subject: 'Chemistry',
    subjectColor: '#f59e0b',
    points: 25,
    dueDate: isoPlus(-5),
    dueLabel: 'Graded',
    type: 'Quiz',
    description: 'Hydrocarbons, functional groups and isomerism.',
    autoGrade: true,
    status: 'graded',
    score: 22,
    feedback: '88% — solid. Revise the naming rules for branched alkanes.',
    stage: 'senior',
  },
]

export const juniorLeaderboard = {
  week: [
    { rank: 1, name: 'Chioma A.', emoji: '🦁', points: 1240, you: false, delta: 1 },
    { rank: 2, name: 'Tunde Bakare', emoji: '🐯', points: 1180, you: true, delta: 1 },
    { rank: 3, name: 'Emeka O.', emoji: '🦊', points: 1120, you: false, delta: -2 },
    { rank: 4, name: 'Fatima M.', emoji: '🐼', points: 1090, you: false, delta: 2 },
    { rank: 5, name: 'David K.', emoji: '🐨', points: 1040, you: false, delta: 0 },
    { rank: 6, name: 'Zainab S.', emoji: '🦄', points: 980, you: false, delta: 3 },
    { rank: 7, name: 'Kemi A.', emoji: '🐸', points: 940, you: false, delta: -1 },
    { rank: 8, name: 'Bola T.', emoji: '🐵', points: 905, you: false, delta: 1 },
  ],
  all: [
    { rank: 1, name: 'Tunde Bakare', emoji: '🐯', points: 8420, you: true, delta: 0 },
    { rank: 2, name: 'Chioma A.', emoji: '🦁', points: 8190, you: false, delta: 1 },
    { rank: 3, name: 'Fatima M.', emoji: '🐼', points: 7740, you: false, delta: -1 },
    { rank: 4, name: 'Emeka O.', emoji: '🦊', points: 7510, you: false, delta: 0 },
    { rank: 5, name: 'Zainab S.', emoji: '🦄', points: 6980, you: false, delta: 2 },
    { rank: 6, name: 'David K.', emoji: '🐨', points: 6640, you: false, delta: -1 },
    { rank: 7, name: 'Bola T.', emoji: '🐵', points: 6120, you: false, delta: 0 },
    { rank: 8, name: 'Kemi A.', emoji: '🐸', points: 5980, you: false, delta: 1 },
  ],
  class: [
    { rank: 1, name: 'Tunde Bakare', emoji: '🐯', points: 1180, you: true, delta: 0 },
    { rank: 2, name: 'Chioma A.', emoji: '🦁', points: 1120, you: false, delta: 1 },
    { rank: 3, name: 'Emeka O.', emoji: '🦊', points: 1040, you: false, delta: -1 },
    { rank: 4, name: 'Fatima M.', emoji: '🐼', points: 990, you: false, delta: 0 },
    { rank: 5, name: 'Kemi A.', emoji: '🐸', points: 880, you: false, delta: 2 },
  ],
}

export const juniorBadges = [
  { id: 'b1', emoji: '🔥', label: '7-Day Streak', earned: true },
  { id: 'b2', emoji: '⭐', label: 'Top Scorer', earned: true },
  { id: 'b3', emoji: '📚', label: 'Bookworm', earned: true },
  { id: 'b4', emoji: '🎯', label: 'Quiz Whiz', earned: false },
  { id: 'b5', emoji: '🧠', label: 'Maths Master', earned: false },
  { id: 'b6', emoji: '🎨', label: 'Creative Mind', earned: false },
]

export const juniorClasses = [
  { id: 'c1', subject: 'Mathematics', teacher: 'Mr. Adeyemi', time: '10:00 AM', duration: '1 hr', emoji: '🔢', color: '#6c3fc5', soft: '#f0eefb', live: true },
  { id: 'c2', subject: 'English Language', teacher: 'Mrs. Okafor', time: '12:00 PM', duration: '1 hr', emoji: '📖', color: '#0ea5e9', soft: '#e8f4fd', live: false },
  { id: 'c3', subject: 'Basic Science', teacher: 'Mr. Ibrahim', time: '2:00 PM', duration: '45 min', emoji: '🔬', color: '#10b981', soft: '#ecfdf5', live: false },
]

export const juniorLessons = [
  { id: 'l1', title: 'Solving Simple Equations', subject: 'Mathematics', instructor: 'Mr. Adeyemi', duration: '18 min', progress: 64, type: 'Recorded', color: '#6c3fc5', soft: '#f0eefb' },
  { id: 'l2', title: 'Chapter 5: Algebra in Real Life', subject: 'Mathematics', instructor: 'Mr. Adeyemi', duration: '1 hr', progress: 0, type: 'Live', color: '#6c3fc5', soft: '#f0eefb', live: true },
  { id: 'l3', title: 'Writing a Strong Introduction', subject: 'English', instructor: 'Mrs. Okafor', duration: '14 min', progress: 100, type: 'Recorded', color: '#0ea5e9', soft: '#e8f4fd' },
  { id: 'l4', title: 'Reading Comprehension Strategies', subject: 'English', instructor: 'Mrs. Okafor', duration: '1 hr', progress: 0, type: 'Live', color: '#0ea5e9', soft: '#e8f4fd' },
  { id: 'l5', title: 'Parts of a Plant Cell', subject: 'Basic Science', instructor: 'Mr. Ibrahim', duration: '22 min', progress: 30, type: 'Recorded', color: '#10b981', soft: '#ecfdf5' },
  { id: 'l6', title: 'Plant Cells Under the Microscope', subject: 'Basic Science', instructor: 'Mr. Ibrahim', duration: '45 min', progress: 0, type: 'Live', color: '#10b981', soft: '#ecfdf5' },
  { id: 'l7', title: 'Nigeria’s Cultural Diversity', subject: 'Social Studies', instructor: 'Mrs. Bello', duration: '26 min', progress: 45, type: 'Recorded', color: '#f59e0b', soft: '#fffbeb' },
  { id: 'l8', title: 'Drawing with Shapes', subject: 'Fine Arts', instructor: 'Ms. Ada', duration: '12 min', progress: 0, type: 'Recorded', color: '#ec4899', soft: '#fdf2f8' },
  { id: 'l9', title: 'Rhythm and Beats', subject: 'Music', instructor: 'Mr. Tayo', duration: '16 min', progress: 80, type: 'Recorded', color: '#8b5cf6', soft: '#f5f3ff' },
]

export const seniorTutors: Tutor[] = [
  { id: 't1', name: 'Mr. Tunde Ojo', emoji: '👨🏿‍🏫', subjects: ['Mathematics', 'Further Maths'], rating: 4.9, reviews: 86, rate: 15000, experience: '12 yrs experience', availability: ['Today, 5 PM', 'Tomorrow, 4 PM', 'Sat, 10 AM'], accent: '#6c3fc5', soft: '#f0eefb' },
  { id: 't2', name: 'Ms. Ada Nwosu', emoji: '👩🏽‍🔬', subjects: ['Physics', 'Further Maths'], rating: 4.8, reviews: 64, rate: 18000, experience: '9 yrs experience', availability: ['Tomorrow, 6 PM', 'Thu, 5 PM'], accent: '#10b981', soft: '#ecfdf5' },
  { id: 't3', name: 'Mr. Ben Eze', emoji: '👨🏽‍🔬', subjects: ['Chemistry'], rating: 4.7, reviews: 51, rate: 16000, experience: '10 yrs experience', availability: ['Today, 7 PM', 'Fri, 3 PM'], accent: '#f59e0b', soft: '#fffbeb' },
  { id: 't4', name: 'Mrs. Grace Obi', emoji: '👩🏽‍🏫', subjects: ['English', 'Literature'], rating: 5.0, reviews: 93, rate: 14000, experience: '15 yrs experience', availability: ['Thu, 11 AM', 'Sat, 2 PM'], accent: '#0ea5e9', soft: '#e8f4fd' },
]

export const upcomingExams = [
  { id: 'e1', subject: 'Mathematics', detail: 'Paper 1 & 2', days: 16, color: '#6c3fc5', soft: '#f0eefb' },
  { id: 'e2', subject: 'English', detail: 'Obj + Essay', days: 18, color: '#0ea5e9', soft: '#e8f4fd' },
  { id: 'e3', subject: 'Physics', detail: 'Theory + Practical', days: 21, color: '#10b981', soft: '#ecfdf5' },
]

export const resources: Resource[] = [
  { id: 'r1', title: 'WAEC Past Questions – Maths 2015–2024', type: 'PDF', subject: 'Mathematics', size: '12 MB', downloads: 1240, category: 'Past Questions', addedBy: 'Dr. Kelechi Azu' },
  { id: 'r2', title: 'Physics Formulas Quick Reference', type: 'PDF', subject: 'Physics', size: '2 MB', downloads: 860, category: 'Revision Notes', addedBy: 'Dr. Kelechi Azu' },
  { id: 'r3', title: 'English Model Essays Collection', type: 'DOC', subject: 'English', size: '5 MB', downloads: 745, category: 'Revision Notes', addedBy: 'Mrs. Okafor' },
  { id: 'r4', title: 'Organic Chemistry Reaction Map', type: 'PDF', subject: 'Chemistry', size: '3 MB', downloads: 512, category: 'Revision Notes', addedBy: 'Mrs. Balogun' },
  { id: 'r5', title: 'Government: Democracy & Constitution', type: 'VIDEO', subject: 'Government', size: '48 min', downloads: 320, category: 'Video Lessons', addedBy: 'Mrs. Bello' },
  { id: 'r6', title: 'Biology Practical – Specimen Guide', type: 'PDF', subject: 'Biology', size: '7 MB', downloads: 429, category: 'Practical Guides', addedBy: 'Mr. Nnamdi' },
]

const trendMonths = Array.from({ length: 6 }, (_, i) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toLocaleDateString('en-GB', { month: 'short' })
})

export const performanceTrend = [62, 68, 71, 74, 77, 79.2].map((score, i) => ({
  label: trendMonths[i],
  score,
  target: 75,
}))

export const subjectStrengths = [
  { subject: 'Maths', value: 88, full: 100 },
  { subject: 'English', value: 84, full: 100 },
  { subject: 'Physics', value: 76, full: 100 },
  { subject: 'Chemistry', value: 72, full: 100 },
  { subject: 'Biology', value: 81, full: 100 },
  { subject: 'Govt', value: 86, full: 100 },
]

export const specialActivities: Activity[] = [
  {
    id: 'act1',
    title: 'Mindfulness Breathing',
    minutes: 5,
    tag: 'Calm',
    color: '#0ea5e9',
    soft: '#e8f4fd',
    emoji: '🌬️',
    description: 'Slow, gentle breathing to help your body feel calm and safe.',
    steps: ['Sit comfortably and let your shoulders relax.', 'Breathe in slowly for 4 counts.', 'Hold for 2 counts, then breathe out for 6 counts.', 'Repeat 6 times. Notice how your body feels.'],
    reward: 10,
  },
  {
    id: 'act2',
    title: 'Emotion Recognition Game',
    minutes: 10,
    tag: 'Social',
    color: '#ec4899',
    soft: '#fdf2f8',
    emoji: '😊',
    description: 'Match faces to feelings and practise naming emotions.',
    steps: ['Look at each face card on the screen.', 'Choose the feeling that matches the face.', 'Say the feeling word out loud.', 'Talk about a time you felt that way.'],
    reward: 15,
  },
  {
    id: 'act3',
    title: 'Creative Drawing Time',
    minutes: 15,
    tag: 'Creative',
    color: '#a855f7',
    soft: '#f6eefe',
    emoji: '🎨',
    description: 'Draw anything that makes you happy. There is no wrong answer.',
    steps: ['Pick your favourite colours.', 'Draw a place where you feel happy.', 'Add one detail you love.', 'Share your drawing with someone you trust.'],
    reward: 15,
  },
  {
    id: 'act4',
    title: 'Music & Movement',
    minutes: 10,
    tag: 'Movement',
    color: '#f59e0b',
    soft: '#fffbeb',
    emoji: '🎵',
    description: 'Move your body to a gentle rhythm and notice the beat.',
    steps: ['Stand with your feet apart.', 'Tap your feet to the beat.', 'Sway your arms slowly.', 'Freeze when the music stops — then giggle!'],
    reward: 10,
  },
  {
    id: 'act5',
    title: 'Story Time',
    minutes: 12,
    tag: 'Language',
    color: '#10b981',
    soft: '#ecfdf5',
    emoji: '📖',
    description: 'A short story with pictures, then three friendly questions.',
    steps: ['Listen to the story about Ada and the little garden.', 'Point to your favourite picture.', 'Answer: What did Ada grow?', 'Tell someone one thing you remember.'],
    reward: 12,
  },
  {
    id: 'act6',
    title: 'Sensory Garden Walk',
    minutes: 8,
    tag: 'Sensory',
    color: '#84cc16',
    soft: '#f7fee7',
    emoji: '🌿',
    description: 'A slow, quiet walk noticing textures, colours and sounds.',
    steps: ['Walk slowly with a trusted adult.', 'Find one green leaf and one yellow flower.', 'Listen for two sounds.', 'Take a big breath of fresh air.'],
    reward: 8,
  },
]

export const specialAwards: Award[] = [
  { id: 'aw1', title: 'Great Communicator', emoji: '🗣️', earned: 'Earned Jun 10', description: 'Used words to share a feeling 5 times.', color: '#0ea5e9' },
  { id: 'aw2', title: 'Brave Explorer', emoji: '🌟', earned: 'Earned Jun 8', description: 'Tried a new activity with support.', color: '#f59e0b' },
  { id: 'aw3', title: 'Creative Artist', emoji: '🎨', earned: 'Earned Jun 5', description: 'Finished 3 creative drawings.', color: '#ec4899' },
  { id: 'aw4', title: 'Focus Champion', emoji: '🎯', earned: 'Earned Jun 1', description: 'Completed 10 focus sessions.', color: '#a855f7' },
  { id: 'aw5', title: 'Kind Friend', emoji: '🤝', earned: null, description: 'Complete 3 social play sessions to unlock.', color: '#10b981' },
  { id: 'aw6', title: 'Calm Keeper', emoji: '🌿', earned: null, description: 'Finish 5 mindful breathing activities.', color: '#84cc16' },
]

export const specialClasses = [
  { id: 'sc1', title: 'Communication Skills', specialist: 'Ms. Sarah', role: 'Speech Therapist', time: '10:00 AM', duration: '1 hour', emoji: '🗣️', color: '#0ea5e9', soft: '#e8f4fd' },
  { id: 'sc2', title: 'Emotional Expression Art', specialist: 'Mr. Emeka', role: 'ASD Specialist', time: '11:30 AM', duration: '1 hour', emoji: '🎨', color: '#ec4899', soft: '#fdf2f8' },
  { id: 'sc3', title: 'Social Interaction Play', specialist: 'Mrs. Adaeze', role: 'Behavioral Coach', time: '2:00 PM', duration: '1 hour', emoji: '🤝', color: '#10b981', soft: '#ecfdf5' },
]

export const specialLessons = [
  { id: 'sl1', title: 'Naming My Feelings', specialist: 'Ms. Sarah', role: 'Speech Therapist', duration: '12 min', next: 'Today, 10:00 AM', emoji: '💬', color: '#0ea5e9', soft: '#e8f4fd', completed: true },
  { id: 'sl2', title: 'Colours and Emotions', specialist: 'Mr. Emeka', role: 'ASD Specialist', duration: '15 min', next: 'Today, 11:30 AM', emoji: '🎨', color: '#ec4899', soft: '#fdf2f8', completed: false },
  { id: 'sl3', title: 'Taking Turns', specialist: 'Mrs. Adaeze', role: 'Behavioral Coach', duration: '10 min', next: 'Today, 2:00 PM', emoji: '🤝', color: '#10b981', soft: '#ecfdf5', completed: false },
  { id: 'sl4', title: 'My Calm Space', specialist: 'Ms. Sarah', role: 'Speech Therapist', duration: '8 min', next: 'Tomorrow, 10:00 AM', emoji: '🌙', color: '#a855f7', soft: '#f6eefe', completed: true },
]

export const specialGrowth = [
  { label: 'Communication', value: 72, delta: '+8 pts', color: '#0ea5e9' },
  { label: 'Confidence', value: 64, delta: '+12 pts', color: '#ec4899' },
  { label: 'Focus Time', value: 58, delta: '+5 pts', color: '#a855f7' },
  { label: 'Social Skills', value: 51, delta: '+15 pts', color: '#10b981' },
]

export const specialFocusTrend = [
  { label: 'Mon', minutes: 15 },
  { label: 'Tue', minutes: 22 },
  { label: 'Wed', minutes: 18 },
  { label: 'Thu', minutes: 28 },
  { label: 'Fri', minutes: 24 },
  { label: 'Sat', minutes: 30 },
  { label: 'Sun', minutes: 20 },
]

export const specialSkillTrend = [
  { label: 'Week 1', communication: 52, confidence: 44, social: 38 },
  { label: 'Week 2', communication: 58, confidence: 50, social: 42 },
  { label: 'Week 3', communication: 64, confidence: 56, social: 46 },
  { label: 'Week 4', communication: 72, confidence: 64, social: 51 },
]

export const teacherClasses: TeacherClass[] = [
  { id: 'tc1', name: 'JSS2 Mathematics', level: 'JSS2', subject: 'Mathematics', color: '#6c3fc5', soft: '#f0eefb', students: 24, time: '10:00 AM', duration: '1 hr', status: 'live' },
  { id: 'tc2', name: 'SSS3 Further Mathematics', level: 'SSS3', subject: 'Further Maths', color: '#0ea5e9', soft: '#e8f4fd', students: 18, time: '12:00 PM', duration: '1 hr', status: 'next' },
  { id: 'tc3', name: 'JSS3 Mathematics', level: 'JSS3', subject: 'Mathematics', color: '#f59e0b', soft: '#fffbeb', students: 30, time: '2:00 PM', duration: '1 hr', status: 'upcoming' },
  { id: 'tc4', name: 'ASD Numeracy Support', level: 'Special', subject: 'Numeracy', color: '#ec4899', soft: '#fdf2f8', students: 4, time: '4:00 PM', duration: '45 min', status: 'upcoming' },
]

export const teacherRequests: TutorRequest[] = [
  { id: 'tr1', student: 'Blessing Nwosu', level: 'SSS3', topic: 'WAEC Maths Prep', rate: 15000 },
  { id: 'tr2', student: 'Kemi Adeleke', level: 'JSS3', topic: 'Numeracy (Special Needs)', rate: 18000, specialist: true },
]

export const teacherStudents: StudentRecord[] = [
  { id: 'st1', name: 'Amaka Achebe', level: 'SSS3', emoji: '🎓', average: 91, attendance: 96, trend: 3 },
  { id: 'st2', name: 'Tunde Bakare', level: 'JSS2', emoji: '🐯', average: 84, attendance: 88, trend: 5 },
  { id: 'st3', name: 'Chioma Eze', level: 'JSS1', emoji: '🦁', average: 78, attendance: 92, trend: 2 },
  { id: 'st4', name: 'Emeka Okonkwo', level: 'SSS2', emoji: '🦊', average: 73, attendance: 79, trend: -2 },
  { id: 'st5', name: 'Fatima Musa', level: 'JSS3', emoji: '🐼', average: 86, attendance: 94, trend: 4 },
  { id: 'st6', name: 'Blessing Nwosu', level: 'SSS3', emoji: '🌸', average: 82, attendance: 90, trend: 1 },
  { id: 'st7', name: 'Kemi Adeleke', level: 'JSS3', emoji: '🦋', average: 69, attendance: 85, trend: 6, support: 'ASD support' },
  { id: 'st8', name: 'David Okafor', level: 'JSS2', emoji: '🐨', average: 75, attendance: 81, trend: -1 },
  { id: 'st9', name: 'Zainab Sule', level: 'SSS1', emoji: '🦄', average: 88, attendance: 97, trend: 2 },
  { id: 'st10', name: 'Chidi Eze', level: 'JSS1', emoji: '🦋', average: 74, attendance: 91, trend: 7, support: 'ASD support' },
]

export const teacherGrading: GradingItem[] = [
  { id: 'g1', assignmentId: 's1', title: 'Integration & Differentiation – Calculus', context: 'SSS3 Maths · Problem Set', student: 'Amaka Achebe', submitted: 'Today, 9:12 AM', total: 40 },
  { id: 'g2', title: 'Comprehension Exercise', context: 'JSS3 English · Comprehension', student: 'Chidi Eze', submitted: 'Yesterday, 4:40 PM', total: 30 },
  { id: 'g3', title: 'Motion & Forces Lab', context: 'SSS3 Physics · Lab Report', student: 'Kemi Adeleke', submitted: 'Yesterday, 7:05 PM', total: 30 },
]

export const attendanceWeek = [
  { label: 'Mon', present: 18, absent: 6 },
  { label: 'Tue', present: 22, absent: 2 },
  { label: 'Wed', present: 20, absent: 4 },
  { label: 'Thu', present: 24, absent: 0 },
  { label: 'Fri', present: 17, absent: 7 },
]

export const earningsMonths = (() => {
  const now = new Date()
  const values = [96, 108, 102, 124, 131, 138]
  return values.map((value, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (values.length - 1 - i), 1)
    return { label: d.toLocaleDateString('en-GB', { month: 'short' }), value }
  })
})()

export const earningsBreakdown = [
  { name: 'General classes', value: 62, color: '#6c3fc5' },
  { name: 'Private tutoring', value: 28, color: '#10b981' },
  { name: 'Premium content', value: 10, color: '#f59e0b' },
]

export const payoutRows = [
  { id: 'p1', period: 'Oct 2026', gross: 131000, commission: 19650, net: 111350, status: 'Paid' },
  { id: 'p2', period: 'Sep 2026', gross: 124000, commission: 18600, net: 105400, status: 'Paid' },
  { id: 'p3', period: 'Aug 2026', gross: 102000, commission: 15300, net: 86700, status: 'Paid' },
]

export const contentLibrary = [
  { id: 'cl1', title: 'Algebra Chapter 5 – Worked Examples', type: 'VIDEO', subject: 'Mathematics', status: 'Published', views: 412, size: '22 min' },
  { id: 'cl2', title: 'Quadratic Equations Revision Notes', type: 'PDF', subject: 'Mathematics', status: 'Published', views: 288, size: '3 MB' },
  { id: 'cl3', title: 'Further Maths: Vectors Problem Set', type: 'DOC', subject: 'Mathematics', status: 'Draft', views: 0, size: '1 MB' },
  { id: 'cl4', title: 'WAEC Maths 2025 Walkthrough', type: 'VIDEO', subject: 'Mathematics', status: 'Published', views: 690, size: '54 min' },
  { id: 'cl5', title: 'Numeracy Games for ASD Learners', type: 'PDF', subject: 'Numeracy', status: 'Published', views: 154, size: '4 MB' },
]

/** Premium plans that can add Parent Access. */
export const PREMIUM_PLAN_IDS: PlanId[] = ['premium', 'premium_plus', 'special']

export const plans: Plan[] = [
  {
    id: 'general',
    name: 'General Plan',
    price: 8500,
    tagline: 'Everything you need for everyday class learning.',
    accent: '#6c3fc5',
    features: ['Live and recorded classes', 'Quizzes and assignments', 'Grades and teacher feedback', 'Study materials and forums', 'Limited developmental activities'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 15000,
    tagline: 'For students who want personal coaching and faster progress.',
    accent: '#0ea5e9',
    popular: true,
    features: ['Everything in General', 'Private 1-on-1 tutoring', 'Personalised learning plans', 'Premium practice materials', 'Priority teacher support', 'Advanced progress analytics'],
  },
  {
    id: 'premium_plus',
    name: 'Premium Plus',
    price: 25000,
    tagline: 'More coaching, exam bootcamps and a dedicated progress coach.',
    accent: '#4169e1',
    features: ['Everything in Premium', 'Twice-weekly private tutoring', 'Exam bootcamps and mock papers', 'Dedicated progress coach', 'Monthly parent strategy call', 'Priority scheduling'],
  },
  {
    id: 'special',
    name: 'Special Needs Premium',
    price: 22000,
    tagline: 'Specialist-led support for ASD and ADHD learners.',
    accent: '#ec4899',
    features: ['Specialised private tutors', 'Personalised behavioural plans', 'Emotional development tracking', 'Speech and confidence sessions', 'Parent–teacher–specialist sessions', 'Therapy-oriented activities'],
  },
]

/**
 * Optional paid add-on: a second guardian gets the full parent dashboard for a
 * child on a premium plan. Priced separately and never required for learning.
 */
export const parentAccessAddon = {
  id: 'parent_access' as const,
  name: 'Parent Access',
  price: 2500,
  tagline: 'Optional add-on for Premium, Premium Plus and Special Needs Premium families.',
  features: [
    'A second guardian gets the full parent dashboard',
    'Weekly progress and attendance digests',
    'Direct teacher and tutor chat threads',
    'Downloadable term reports',
  ],
}

export const childrenData: Record<ChildId, ChildProfile> = {
  tunde: {
    id: 'tunde',
    name: 'Tunde Bakare',
    level: 'JSS2',
    emoji: '🐯',
    color: '#f97316',
    soft: '#fff4e8',
    plan: 'general',
    average: 79.3,
    averageLabel: 'Average Score',
    averageTrend: '+5% this month',
    attendance: 87.5,
    attendanceLabel: '17.5 / 20 classes',
    workDone: '12 / 15',
    workLabel: '80% completion',
    streak: '7 days',
    streakLabel: 'Keep it up!',
    lessonCompletion: [
      { name: 'Completed', value: 78, color: '#10b981' },
      { name: 'In progress', value: 14, color: '#f59e0b' },
      { name: 'Not started', value: 8, color: '#e5e7eb' },
    ],
    grades: [
      { code: 'MAT', subject: 'Mathematics', grade: 'A', teacher: 'Mr. Adeyemi', score: 84, color: '#6c3fc5' },
      { code: 'ENG', subject: 'English', grade: 'A+', teacher: 'Mrs. Okafor', score: 92, color: '#0ea5e9' },
      { code: 'BAS', subject: 'Basic Science', grade: 'B+', teacher: 'Mr. Ibrahim', score: 77, color: '#10b981' },
      { code: 'SOC', subject: 'Social Studies', grade: 'A-', teacher: 'Mrs. Bello', score: 81, color: '#f59e0b' },
    ],
    trend: [68, 71, 73, 76, 77, 79.3].map((score, i) => ({ label: trendMonths[i], score, classAvg: [66, 68, 69, 71, 72, 73][i] })),
  },
  chidi: {
    id: 'chidi',
    name: 'Chidi Eze',
    level: 'JSS1',
    emoji: '🦋',
    color: '#a855f7',
    soft: '#f6eefe',
    plan: 'special',
    average: 74,
    averageLabel: 'Communication Growth',
    averageTrend: '+8 pts this month',
    attendance: 92,
    attendanceLabel: '18 / 20 sessions',
    workDone: '14 / 16',
    workLabel: '88% activities done',
    streak: '12 days',
    streakLabel: 'Calm-day streak',
    lessonCompletion: [
      { name: 'Completed', value: 70, color: '#a855f7' },
      { name: 'In progress', value: 20, color: '#0ea5e9' },
      { name: 'Not started', value: 10, color: '#e5e7eb' },
    ],
    grades: [
      { code: 'COM', subject: 'Communication', grade: 'A', teacher: 'Ms. Sarah', score: 82, color: '#0ea5e9' },
      { code: 'EMO', subject: 'Emotional Skills', grade: 'B+', teacher: 'Mr. Emeka', score: 76, color: '#ec4899' },
      { code: 'SOC', subject: 'Social Play', grade: 'B', teacher: 'Mrs. Adaeze', score: 71, color: '#10b981' },
      { code: 'FOC', subject: 'Focus & Regulation', grade: 'A-', teacher: 'Ms. Sarah', score: 80, color: '#a855f7' },
    ],
    trend: [52, 56, 61, 66, 70, 74].map((score, i) => ({ label: trendMonths[i], score, classAvg: [60, 61, 62, 63, 64, 65][i] })),
    special: true,
  },
}

export const parentAlerts: AlertItem[] = [
  { id: 'al1', text: 'Tunde missed today’s Basic Science class', time: '2h ago', tone: 'warn', child: 'tunde' },
  { id: 'al2', text: 'Chidi completed the Mindfulness activity ⭐', time: '30 min ago', tone: 'good', child: 'chidi' },
  { id: 'al3', text: 'Assignment due tomorrow: Algebra Chapter 5', time: '4h ago', tone: 'info', child: 'tunde' },
  { id: 'al4', text: 'English essay graded: 92 / 100', time: 'Yesterday', tone: 'good', child: 'tunde' },
  { id: 'al5', text: 'Ms. Sarah shared Chidi’s weekly progress note', time: 'Yesterday', tone: 'good', child: 'chidi' },
]

export const parentTeachers = {
  tunde: [
    { id: 'pt1', name: 'Mr. Adeyemi', initials: 'OA', subject: 'Mathematics', rating: 4.9, color: '#6c3fc5', soft: '#f0eefb' },
    { id: 'pt2', name: 'Mrs. Okafor', initials: 'MO', subject: 'English', rating: 4.8, color: '#0ea5e9', soft: '#e8f4fd' },
    { id: 'pt3', name: 'Mr. Ibrahim', initials: 'MI', subject: 'Basic Science', rating: 4.7, color: '#10b981', soft: '#ecfdf5' },
  ],
  chidi: [
    { id: 'pc1', name: 'Ms. Sarah', initials: 'SA', subject: 'Speech Therapist', rating: 5.0, color: '#0ea5e9', soft: '#e8f4fd' },
    { id: 'pc2', name: 'Mr. Emeka', initials: 'EM', subject: 'ASD Specialist', rating: 4.9, color: '#ec4899', soft: '#fdf2f8' },
    { id: 'pc3', name: 'Mrs. Adaeze', initials: 'AD', subject: 'Behavioral Coach', rating: 4.9, color: '#10b981', soft: '#ecfdf5' },
  ],
}

export const billingHistory = [
  { id: 'bh1', date: '12 Oct 2026', child: 'Tunde Bakare', plan: 'General Plan', amount: 8500, status: 'Paid' },
  { id: 'bh2', date: '12 Oct 2026', child: 'Chidi Eze', plan: 'Special Needs Premium', amount: 22000, status: 'Paid' },
  { id: 'bh3', date: '12 Sep 2026', child: 'Tunde Bakare', plan: 'General Plan', amount: 8500, status: 'Paid' },
  { id: 'bh4', date: '12 Sep 2026', child: 'Chidi Eze', plan: 'Special Needs Premium', amount: 22000, status: 'Paid' },
]

export const specialSupport = {
  goals: [
    { id: 'sg1', title: 'Use words to name a feeling', detail: 'Practise 3 emotion words each day with Ms. Sarah.', progress: 74, color: '#0ea5e9' },
    { id: 'sg2', title: 'Stay regulated through transitions', detail: 'Use the calm corner or breathing card when moving between classes.', progress: 62, color: '#a855f7' },
    { id: 'sg3', title: 'Join a group play activity', detail: 'Take turns in a supported 10-minute play session.', progress: 51, color: '#10b981' },
    { id: 'sg4', title: 'Ask for a break independently', detail: 'Use the break card before becoming overwhelmed.', progress: 80, color: '#ec4899' },
  ],
  sessions: [
    { id: 'ss1', title: 'Speech & Language', specialist: 'Ms. Sarah', when: 'Mon & Wed · 10:00 AM', next: 'Tomorrow, 10:00 AM', emoji: '🗣️' },
    { id: 'ss2', title: 'Emotional Regulation', specialist: 'Mr. Emeka', when: 'Thu · 11:30 AM', next: 'Today, 11:30 AM', emoji: '🎨' },
    { id: 'ss3', title: 'Social Skills Play', specialist: 'Mrs. Adaeze', when: 'Fri · 2:00 PM', next: 'Friday, 2:00 PM', emoji: '🤝' },
  ],
  guidance: [
    { id: 'gp1', title: 'Supporting sensory overload at home', type: 'PDF', size: '1.2 MB' },
    { id: 'gp2', title: 'Visual schedule template', type: 'PDF', size: '600 KB' },
    { id: 'gp3', title: 'Talking about big feelings', type: 'VIDEO', size: '8 min' },
  ],
  behaviorTrend: [
    { label: 'Week 1', regulation: 42, communication: 50 },
    { label: 'Week 2', regulation: 55, communication: 56 },
    { label: 'Week 3', regulation: 61, communication: 64 },
    { label: 'Week 4', regulation: 74, communication: 72 },
  ],
}

export const supervisionDefaults = {
  restrictMessaging: true,
  screenTimeLimit: true,
  weeklyDigest: true,
  classRecordings: true,
}

export const notificationsByRole: Record<Audience, Array<{ id: string; title: string; body: string; time: string; tone: 'info' | 'good' | 'warn' }>> = {
  junior: [
    { id: 'jn1', title: 'Algebra assignment due today', body: 'Submit before 11:59 PM to keep your streak.', time: '1h ago', tone: 'warn' },
    { id: 'jn2', title: 'New badge unlocked', body: 'You earned the Bookworm badge. Nice one!', time: '3h ago', tone: 'good' },
    { id: 'jn3', title: 'Maths class is live', body: 'Mr. Adeyemi is waiting in the classroom.', time: 'Now', tone: 'info' },
  ],
  senior: [
    { id: 'sn1', title: 'Calculus problem set due today', body: '5 WAEC-style questions, 40 points.', time: '1h ago', tone: 'warn' },
    { id: 'sn2', title: 'Tutor session confirmed', body: 'Ms. Ada Nwosu confirmed your Friday session.', time: '2h ago', tone: 'good' },
    { id: 'sn3', title: 'WAEC countdown', body: 'Add 30 minutes of past questions to today’s plan.', time: 'Now', tone: 'info' },
  ],
  special: [
    { id: 'spn1', title: 'Ms. Sarah sent a note', body: '“You did beautifully naming feelings today.”', time: '30m ago', tone: 'good' },
    { id: 'spn2', title: 'Art class at 11:30 AM', body: 'Mr. Emeka has the colours ready.', time: '1h ago', tone: 'info' },
  ],
  teacher: [
    { id: 'tn1', title: 'New tutoring request', body: 'Blessing Nwosu booked WAEC Maths Prep.', time: '20m ago', tone: 'info' },
    { id: 'tn2', title: '3 submissions awaiting grading', body: 'Calculus, Comprehension and Motion & Forces.', time: '1h ago', tone: 'warn' },
    { id: 'tn3', title: 'Payout processed', body: `${payoutRows[0].period.split(' ')[0]} earnings of ₦${payoutRows[0].net.toLocaleString()} sent.`, time: 'Yesterday', tone: 'good' },
  ],
  parent: [
    { id: 'pn1', title: 'Tunde missed Basic Science', body: 'The class started at 2:00 PM.', time: '2h ago', tone: 'warn' },
    { id: 'pn2', title: 'Chidi’s weekly note is ready', body: 'Ms. Sarah shared progress from this week.', time: 'Yesterday', tone: 'good' },
    { id: 'pn3', title: 'Payment successful', body: '₦22,000 for Chidi’s Special Needs Premium plan.', time: '2d ago', tone: 'good' },
  ],
  admin: [
    { id: 'ad1', title: '2 teachers await approval', body: 'Mr. Ifeanyi Okonkwo and Ms. Halima Bello submitted documents.', time: '25m ago', tone: 'warn' },
    { id: 'ad2', title: 'Lesson flagged by a parent', body: '“Cell Biology” contains an unverified external link.', time: '2h ago', tone: 'warn' },
    { id: 'ad3', title: 'Payouts ready', body: '₦412,000 across 9 teachers is ready to process.', time: 'Yesterday', tone: 'info' },
  ],
}

export const seedThreads: Thread[] = [
  {
    id: 'junior-class',
    audience: 'junior',
    title: 'JSS2 Class Chat',
    subtitle: '24 classmates · Mr. Adeyemi',
    emoji: '🐯',
    unread: 3,
    messages: [
      { id: 'm1', author: 'Chioma A.', text: 'Who else is finding question 3 tricky? 😅', time: '9:02 AM', avatar: '🦁' },
      { id: 'm2', author: 'Emeka O.', text: 'I think you have to divide both sides first', time: '9:04 AM', avatar: '🦊' },
      { id: 'm3', author: 'Mr. Adeyemi', text: 'Great discussion! I’ll go through question 3 in class at 10.', time: '9:12 AM', staff: true },
      { id: 'm4', author: 'Chioma A.', text: 'Thank you sir! 🙌', time: '9:13 AM', avatar: '🦁' },
    ],
  },
  {
    id: 'junior-announcements',
    audience: 'junior',
    title: 'Teacher Announcements',
    subtitle: 'Mr. Adeyemi · Mathematics',
    emoji: '📢',
    pinned: 'Remember: Algebra Chapter 5 is due today. Bring your workbooks to the live class.',
    messages: [
      { id: 'm5', author: 'Mr. Adeyemi', text: 'Good morning JSS2! Today we continue Chapter 5. Have your workbooks ready.', time: '7:30 AM', staff: true },
      { id: 'm6', author: 'Mr. Adeyemi', text: 'Algebra Chapter 5 exercises are due today before 11:59 PM.', time: '7:32 AM', staff: true },
    ],
  },
  {
    id: 'junior-buddies',
    audience: 'junior',
    title: 'Study Buddies',
    subtitle: 'Chioma, Emeka & you',
    emoji: '🦊',
    unread: 1,
    messages: [
      { id: 'm7', author: 'Emeka O.', text: 'Library at 4? We can finish the science report together.', time: 'Yesterday', avatar: '🦊' },
      { id: 'm8', author: 'Tunde Bakare', text: 'Yes! I’ll bring the diagram I drew.', time: 'Yesterday', mine: true },
      { id: 'm9', author: 'Chioma A.', text: 'Count me in 🙌', time: 'Yesterday', avatar: '🦁' },
    ],
  },
  {
    id: 'junior-okafor',
    audience: 'junior',
    title: 'Mrs. Okafor',
    subtitle: 'English Teacher',
    emoji: '👩🏽‍🏫',
    messages: [
      { id: 'm10', author: 'Mrs. Okafor', text: 'Tunde, your book review was submitted successfully. I’ll share feedback soon.', time: 'Yesterday', staff: true },
      { id: 'm11', author: 'Tunde Bakare', text: 'Thank you ma. I enjoyed the ending!', time: 'Yesterday', mine: true },
    ],
  },
  {
    id: 'senior-hub',
    audience: 'senior',
    title: 'SSS3 Science Hub',
    subtitle: '32 classmates · Dr. Azu',
    emoji: '📚',
    unread: 2,
    messages: [
      { id: 'sm1', author: 'Zainab S.', text: 'Anyone have the physics practical summary?', time: '8:40 AM', avatar: '🦄' },
      { id: 'sm2', author: 'Dr. Azu', text: 'I uploaded the specimen guide to Study Resources this morning.', time: '8:46 AM', staff: true },
      { id: 'sm3', author: 'Amaka Achebe', text: 'Found it, thank you sir!', time: '8:50 AM', mine: true },
    ],
  },
  {
    id: 'senior-waec',
    audience: 'senior',
    title: 'WAEC Study Group',
    subtitle: '8 members · Past questions squad',
    emoji: '🎯',
    messages: [
      { id: 'sm4', author: 'Blessing N.', text: 'Maths paper at 6 PM today?', time: 'Yesterday', avatar: '🌸' },
      { id: 'sm5', author: 'Amaka Achebe', text: 'I’m in. Let’s do 2023 and 2024.', time: 'Yesterday', mine: true },
      { id: 'sm6', author: 'Zainab S.', text: 'Same. I’ll time us ⏱️', time: 'Yesterday', avatar: '🦄' },
    ],
  },
  {
    id: 'senior-ada',
    audience: 'senior',
    title: 'Ms. Ada Nwosu',
    subtitle: 'Physics Tutor',
    emoji: '👩🏽‍🔬',
    messages: [
      { id: 'sm7', author: 'Ms. Ada Nwosu', text: 'Hi Amaka — confirmed for Friday 4 PM. We’ll focus on electricity.', time: '2h ago', staff: true },
      { id: 'sm8', author: 'Amaka Achebe', text: 'Perfect. I’ll bring my past questions.', time: '2h ago', mine: true },
    ],
  },
  {
    id: 'senior-announcements',
    audience: 'senior',
    title: 'Teacher Announcements',
    subtitle: 'SSS3 · WAEC prep',
    emoji: '📢',
    pinned: 'Mock exams begin in two weeks. Check the Exam Prep section for the timetable.',
    messages: [
      { id: 'sm9', author: 'Dr. Azu', text: 'Well done on last week’s mock. Average rose by 3.4% as a class!', time: 'Mon', staff: true },
      { id: 'sm10', author: 'Mrs. Okafor', text: 'Model essays are now available in Study Resources.', time: 'Mon', staff: true },
    ],
  },
  {
    id: 'special-sarah',
    audience: 'special',
    title: 'Ms. Sarah',
    subtitle: 'Speech Therapist',
    emoji: '🌷',
    unread: 1,
    messages: [
      { id: 'spm1', author: 'Ms. Sarah', text: 'Hi Chidi! I loved how you used your words in class today. 🌟', time: '30m ago', staff: true },
      { id: 'spm2', author: 'Chidi Eze', text: 'Thank you Ms. Sarah 😊', time: '28m ago', mine: true },
    ],
  },
  {
    id: 'special-emeka',
    audience: 'special',
    title: 'Mr. Emeka',
    subtitle: 'ASD Specialist',
    emoji: '🎨',
    messages: [
      { id: 'spm3', author: 'Mr. Emeka', text: 'I put new colours in the art room for our feelings picture.', time: 'Yesterday', staff: true },
      { id: 'spm4', author: 'Chidi Eze', text: 'Can I use the purple?', time: 'Yesterday', mine: true },
      { id: 'spm5', author: 'Mr. Emeka', text: 'Of course! Purple is yours.', time: 'Yesterday', staff: true },
    ],
  },
  {
    id: 'special-adaeze',
    audience: 'special',
    title: 'Mrs. Adaeze',
    subtitle: 'Behavioral Coach',
    emoji: '🤝',
    messages: [
      { id: 'spm6', author: 'Mrs. Adaeze', text: 'Remember, you can use your break card any time you need it.', time: 'Mon', staff: true },
    ],
  },
  {
    id: 'special-family',
    audience: 'special',
    title: 'Family Circle',
    subtitle: 'Mum & your support team',
    emoji: '👪',
    messages: [
      { id: 'spm7', author: 'Mum', text: 'So proud of you today, my love. 💙', time: 'Yesterday', avatar: '👩🏿' },
      { id: 'spm8', author: 'Ms. Sarah', text: 'Chidi had a wonderful session. We talked about the garden.', time: 'Yesterday', staff: true },
    ],
  },
  {
    id: 'teacher-bakare',
    audience: 'teacher',
    title: 'Mrs. Ngozi Bakare',
    subtitle: 'Parent · Tunde JSS2',
    emoji: '👩🏿',
    unread: 2,
    messages: [
      { id: 'tm1', author: 'Mrs. Bakare', text: 'Good morning Dr. Azu. Tunde was unwell yesterday — could he get extra time for the assignment?', time: '8:10 AM' },
      { id: 'tm2', author: 'Dr. Kelechi Azu', text: 'Of course. I’ll extend it to Friday and send the notes he missed.', time: '8:20 AM', mine: true },
      { id: 'tm3', author: 'Mrs. Bakare', text: 'Thank you so much. He’s already working on Chapter 5.', time: '8:24 AM' },
    ],
  },
  {
    id: 'teacher-amaka',
    audience: 'teacher',
    title: 'Amaka Achebe',
    subtitle: 'SSS3 · Further Maths',
    emoji: '🎓',
    messages: [
      { id: 'tm4', author: 'Amaka Achebe', text: 'Good afternoon sir. Please can you check question 4 on the calculus set?', time: 'Yesterday' },
      { id: 'tm5', author: 'Dr. Kelechi Azu', text: 'The limit needs factoring first. I’ll post a worked solution tonight.', time: 'Yesterday', mine: true },
    ],
  },
  {
    id: 'teacher-parents',
    audience: 'teacher',
    title: 'JSS2 Parents Group',
    subtitle: '18 parents · Mathematics',
    emoji: '👪',
    unread: 1,
    messages: [
      { id: 'tm6', author: 'Mr. Okafor', text: 'Will the maths club still hold on Friday?', time: '2h ago' },
      { id: 'tm7', author: 'Dr. Kelechi Azu', text: 'Yes, 3 PM in the main hall. All JSS2 parents are welcome.', time: '2h ago', mine: true },
    ],
  },
  {
    id: 'teacher-staff',
    audience: 'teacher',
    title: 'Staff Room',
    subtitle: 'Teaching team',
    emoji: '🏫',
    messages: [
      { id: 'tm8', author: 'Ms. Sarah', text: 'Sharing the sensory-friendly classroom checklist for anyone teaching our ASD learners.', time: 'Mon' },
      { id: 'tm9', author: 'Dr. Kelechi Azu', text: 'Thanks Sarah — I’ll use it for the 4 PM numeracy group.', time: 'Mon', mine: true },
    ],
  },
  {
    id: 'parent-adeyemi',
    audience: 'parent',
    title: 'Mr. Adeyemi',
    subtitle: 'Mathematics · Tunde JSS2',
    emoji: '👨🏿‍🏫',
    messages: [
      { id: 'pm1', author: 'Mr. Adeyemi', text: 'Tunde did well in today’s algebra practice. He scored 16/20.', time: 'Yesterday', staff: true },
      { id: 'pm2', author: 'Mrs. Ngozi Bakare', text: 'That’s wonderful to hear. Thank you for the update.', time: 'Yesterday', mine: true },
    ],
  },
  {
    id: 'parent-okafor',
    audience: 'parent',
    title: 'Mrs. Okafor',
    subtitle: 'English · Tunde JSS2',
    emoji: '👩🏽‍🏫',
    messages: [
      { id: 'pm3', author: 'Mrs. Okafor', text: 'Tunde’s cultural heritage essay was submitted on time. I’ll share feedback this week.', time: '2h ago', staff: true },
    ],
  },
  {
    id: 'parent-sarah',
    audience: 'parent',
    title: 'Ms. Sarah',
    subtitle: 'Speech Therapist · Chidi',
    emoji: '🌷',
    unread: 1,
    messages: [
      { id: 'pm4', author: 'Ms. Sarah', text: 'Chidi had a lovely week. He named three feelings independently and asked for a break when he needed one.', time: 'Yesterday', staff: true },
      { id: 'pm5', author: 'Mrs. Ngozi Bakare', text: 'That is such a big step. Thank you for the support.', time: 'Yesterday', mine: true },
    ],
  },
  {
    id: 'parent-support',
    audience: 'parent',
    title: 'NeuroBloom Support',
    subtitle: 'Safeguarding & billing',
    emoji: '🛟',
    messages: [
      { id: 'pm6', author: 'NeuroBloom Support', text: 'Your October payment was successful. Both learner plans are active.', time: '2d ago', staff: true },
    ],
  },
]
