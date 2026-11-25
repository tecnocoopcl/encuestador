import test from 'node:test'
import assert from 'node:assert/strict'
import { responsesToCsv, splitSteps, validateAnswers, validateSurvey } from '../src/model.js'

test('los pasos parten la encuesta en páginas que se validan por separado', () => {
  const q = (id, required = false) => ({ id, label: id, type: 'short', required, options: [] })
  const survey = { questions: [q('a', true), { id: 'p2', type: 'step', title: 'Dos' }, { id: 's', type: 'section', title: 'S' }, q('b', true)] }
  const pages = splitSteps(survey)
  assert.deepEqual(pages.map((p) => [p.step?.id ?? null, p.items.map((i) => i.id)]), [[null, ['a']], ['p2', ['s', 'b']]])
  assert.deepEqual(Object.keys(validateAnswers(survey, {}, pages[0].items)), ['a'])
  assert.deepEqual(Object.keys(validateAnswers(survey, {})), ['a', 'b'])
  assert.equal(splitSteps({ questions: [{ id: 'p1', type: 'step', title: 'Uno' }, q('a')] }).length, 1)
  assert.equal(splitSteps({ questions: [q('a')] })[0].step, null)
  assert.equal(responsesToCsv({ questions: survey.questions }, []), 'Fecha,a,b')
})

const survey = {
  title: 'Decisión',
  questions: [
    { id: 'q1', label: 'Comentario', type: 'short', required: true, options: [] },
    { id: 'q2', label: 'Prioridades', type: 'multiple', required: false, options: ['A', 'B'] },
  ],
}

test('valida el título y las preguntas del constructor', () => {
  const errors = validateSurvey({ title: ' ', questions: [{ id: 'q', label: '', type: 'single', options: ['Igual', 'Igual'] }] })
  assert.equal(errors.title, 'Escribe un título para la encuesta.')
  assert.equal(errors.q.label, 'Escribe la pregunta.')
  assert.equal(errors.q.options, 'Las alternativas no pueden repetirse.')
})

test('exige respuestas marcadas como obligatorias', () => {
  assert.deepEqual(validateAnswers(survey, {}), { q1: 'Esta respuesta es obligatoria.' })
  assert.deepEqual(validateAnswers(survey, { q1: 'Sí' }), {})
})

test('exporta respuestas y escapa valores CSV', () => {
  const csv = responsesToCsv(survey, [{ submittedAt: '2026-10-20T12:00:00.000Z', answers: { q1: 'Sí, de acuerdo', q2: ['A', 'B'] } }])
  assert.match(csv, /Fecha,Comentario,Prioridades/)
  assert.match(csv, /"Sí, de acuerdo"/)
  assert.match(csv, /A; B/)
})

test('las secciones no se responden ni se exigen', () => {
  const conSecciones = { questions: [{ id: 's1', type: 'section', title: 'Parte 1' }, { id: 'q1', label: 'Nombre', type: 'short', required: true, options: [] }] }
  assert.deepEqual(validateAnswers(conSecciones, { q1: 'Ana' }), {})
  assert.ok(validateAnswers(conSecciones, { q1: '   ' }).q1)
})
