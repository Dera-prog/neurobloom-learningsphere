// Dumps the answer keys of every practice quiz so they can be seeded into
// public.quiz_keys (migration 0013). The questions themselves stay in the
// bundle; only the indexes of the correct options live server-side.
//
//   node scripts/export-quiz-keys.mjs           # JSON
//   node scripts/export-quiz-keys.mjs --sql     # insert statements
import ts from 'typescript'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const dir = mkdtempSync(join(tmpdir(), 'nb-quiz-'))

function load(relative) {
  const source = readFileSync(join(root, relative), 'utf8')
  const out = join(dir, `${relative.replace(/[\\/]/g, '_')}.mjs`)
  writeFileSync(
    out,
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  )
  return pathToFileURL(out).href
}

// curriculum.ts only imports a type, which transpileModule erases.
const curriculum = await import(load('src/data/curriculum.ts'))
const content = await import(load('src/data/content.ts'))

const rows = []
for (const subject of [...curriculum.juniorCurriculum, ...curriculum.seniorCurriculum]) {
  for (const topic of subject.topics) {
    rows.push({
      quiz_id: topic.id,
      label: `${subject.name} · ${topic.title}`,
      question_count: topic.questions.length,
      answer_key: topic.questions.map((q) => q.correct),
    })
  }
}
for (const [quizId, questions] of Object.entries(content.examQuestions)) {
  rows.push({
    quiz_id: quizId,
    label: `Mock paper · ${quizId}`,
    question_count: questions.length,
    answer_key: questions.map((q) => q.correct),
  })
}

if (process.argv.includes('--sql')) {
  const lines = rows.map(
    (row) =>
      `  (${quote(row.quiz_id)}, ${quote(row.label)}, ${row.question_count}, ${quote(
        JSON.stringify(row.answer_key),
      )}::jsonb)`,
  )
  console.log(
    `insert into public.quiz_keys (quiz_id, label, question_count, answer_key) values\n${lines.join(',\n')}\non conflict (quiz_id) do update set label = excluded.label, question_count = excluded.question_count, answer_key = excluded.answer_key, updated_at = now();`,
  )
} else {
  console.log(JSON.stringify(rows, null, 2))
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}
