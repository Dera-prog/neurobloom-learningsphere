import { isSupabaseConfigured, supabase } from './supabase'

export interface QuizSave {
  score: number
  best: number
  questionCount: number
}

/**
 * Best saved score per quiz. Returns null when the tables are unreachable so
 * demo mode keeps its local scores.
 */
export async function loadQuizScores(): Promise<Record<string, number> | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase.from('quiz_attempts').select('quiz_id, score')
  if (error) return null
  const scores: Record<string, number> = {}
  for (const row of (data ?? []) as { quiz_id: string; score: number }[]) {
    scores[row.quiz_id] = row.score
  }
  return scores
}

/**
 * Sends the picked options; the database marks them and returns the attempt
 * score plus the learner's best. The browser never writes a mark itself.
 */
export async function recordQuizAttempt(quizId: string, answers: number[]): Promise<QuizSave | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase.rpc('record_quiz_attempt', {
    p_quiz_id: quizId,
    p_answers: answers,
  })
  if (error) {
    console.warn('Could not save quiz attempt:', error.message)
    return null
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | { score?: number; best?: number; question_count?: number }
    | null
  if (!row || typeof row.score !== 'number') return null
  return {
    score: row.score,
    best: typeof row.best === 'number' ? row.best : row.score,
    questionCount: typeof row.question_count === 'number' ? row.question_count : answers.length,
  }
}
