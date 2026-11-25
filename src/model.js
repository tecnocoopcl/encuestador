export const QUESTION_TYPES = [
  { value: 'short', label: 'Texto breve' },
  { value: 'long', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'single', label: 'Una alternativa' },
  { value: 'multiple', label: 'Varias alternativas' },
]

export function id(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}

export function emptyQuestion(position = 0) {
  return {
    id: id('pregunta'),
    label: '',
    description: '',
    type: 'short',
    required: false,
    options: ['Opción 1', 'Opción 2'],
    position,
  }
}

export function emptySurvey() {
  const now = new Date().toISOString()
  return {
    id: id('encuesta'),
    title: 'Encuesta sin título',
    description: '',
    status: 'draft',
    questions: [emptyQuestion(0)],
    createdAt: now,
    updatedAt: now,
  }
}

export function initialState() {
  return {
    version: 1,
    surveys: [],
    responses: {},
  }
}

export function normalizeState(value) {
  if (!value || typeof value !== 'object') return initialState()
  return {
    version: 1,
    surveys: Array.isArray(value.surveys) ? value.surveys : [],
    responses: value.responses && typeof value.responses === 'object' ? value.responses : {},
  }
}

export function validateSurvey(survey) {
  const errors = {}
  if (!survey.title.trim()) errors.title = 'Escribe un título para la encuesta.'
  if (!survey.questions.length) errors.questions = 'Agrega al menos una pregunta.'

  survey.questions.forEach((question) => {
    const questionErrors = {}
    if (!question.label.trim()) questionErrors.label = 'Escribe la pregunta.'
    if (['single', 'multiple'].includes(question.type)) {
      const options = question.options.map((option) => option.trim()).filter(Boolean)
      if (options.length < 2) questionErrors.options = 'Agrega al menos dos alternativas.'
      if (new Set(options.map((option) => option.toLocaleLowerCase('es'))).size !== options.length) {
        questionErrors.options = 'Las alternativas no pueden repetirse.'
      }
    }
    if (Object.keys(questionErrors).length) errors[question.id] = questionErrors
  })
  return errors
}

function isEmpty(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)
}

export const isSection = (item) => item?.type === 'section'

/** Un paso parte una página nueva: se responde un paso a la vez y se envía en el último. */
export const isStep = (item) => item?.type === 'step'

/** Secciones y pasos ordenan la encuesta, pero no reciben respuesta. */
export const isHeading = (item) => isSection(item) || isStep(item)

/**
 * Parte la encuesta en páginas: `[{ step, items }]`. Lo que va antes del primer
 * paso es una página sin paso (`step: null`); si la encuesta parte con un paso,
 * no hay una página vacía antes. Sin pasos, todo es una sola página.
 */
export function splitSteps(survey) {
  const pages = []
  for (const item of survey.questions ?? []) {
    if (isStep(item)) pages.push({ step: item, items: [] })
    else {
      if (!pages.length) pages.push({ step: null, items: [] })
      pages.at(-1).items.push(item)
    }
  }
  return pages.length ? pages : [{ step: null, items: [] }]
}

/** Valida toda la encuesta o, con `items`, solo las preguntas de una página. */
export function validateAnswers(survey, answers, items = survey.questions) {
  const errors = {}
  items.forEach((question) => {
    if (isHeading(question)) return
    const value = answers[question.id]
    if (question.required && isEmpty(value)) errors[question.id] = 'Esta respuesta es obligatoria.'
    if (question.type === 'number' && !isEmpty(value) && !Number.isFinite(Number(value))) {
      errors[question.id] = 'Ingresa un número válido.'
    }
  })
  return errors
}

export function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(' · ')
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function responsesToCsv(survey, responses) {
  const questions = survey.questions.filter((question) => !isHeading(question))
  const header = ['Fecha', ...questions.map((question) => question.label)]
  const rows = responses.map((response) => [
    new Date(response.submittedAt).toLocaleString('es-CL'),
    ...questions.map((question) => {
      const value = response.answers[question.id]
      return Array.isArray(value) ? value.join('; ') : value ?? ''
    }),
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'encuesta'
}
