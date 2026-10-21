import test from 'node:test'
import assert from 'node:assert/strict'
import { responsesToCsv, validateAnswers, validateSurvey } from '../src/model.js'

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
