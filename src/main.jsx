import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import {
  QUESTION_TYPES,
  emptyQuestion,
  emptySurvey,
  formatAnswer,
  id,
  initialState,
  responsesToCsv,
  slugify,
  validateAnswers,
  validateSurvey,
} from './model.js'
import { createStore } from './storage.js'

function Icon({ name }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    survey: <><path d="M8 4h8M7 7h10a2 2 0 0 1 2 2v10H5V9a2 2 0 0 1 2-2Z" /><path d="M9 3h6v5H9zM9 12h6M9 15h4" /></>,
    results: <><path d="M5 19V9M12 19V5M19 19v-7" /><path d="M3 19h18" /></>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z" /><path d="m14.5 7.5 3 3" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 19h14" /></>,
    chevronUp: <path d="m7 14 5-5 5 5" />,
    chevronDown: <path d="m7 10 5 5 5-5" />,
    check: <path d="m5 12 4 4L19 6" />,
    back: <path d="m15 18-6-6 6-6" />,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Button({ children, variant = 'primary', icon, ...props }) {
  return <button className={`button button--${variant}`} {...props}>{icon && <Icon name={icon} />}{children}</button>
}

function FieldError({ children }) {
  return children ? <p className="field-error" role="alert">{children}</p> : null
}

function ConfirmDialog({ open, onCancel, onConfirm }) {
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
      <div className="dialog__icon"><Icon name="trash" /></div>
      <h2 id="delete-title">¿Eliminar esta encuesta?</h2>
      <p id="delete-description">También se eliminarán todas sus respuestas. Esta acción no se puede deshacer.</p>
      <div className="dialog__actions"><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>Eliminar encuesta</Button></div>
    </section>
  </div>
}

function EmptyState({ onCreate }) {
  return <section className="empty-state">
    <div className="empty-state__icon"><Icon name="survey" /></div>
    <h2>Crea la primera encuesta</h2>
    <p>Construye preguntas por módulos, recibe respuestas y revisa los resultados en un solo lugar.</p>
    <Button icon="plus" onClick={onCreate}>Nueva encuesta</Button>
  </section>
}

function SurveyList({ surveys, responses, onCreate, onOpen, onRespond, onResults, onDelete }) {
  return <main className="page page--wide">
    <header className="page-heading">
      <div><p className="eyebrow">Participación cooperativa</p><h1>Encuestas</h1><p>Diseña consultas claras y reúne las respuestas de los socios.</p></div>
      <Button icon="plus" onClick={onCreate}>Nueva encuesta</Button>
    </header>
    {!surveys.length ? <EmptyState onCreate={onCreate} /> : <div className="survey-grid">
      {surveys.map((survey) => {
        const count = responses[survey.id]?.length ?? 0
        return <article className="survey-card" key={survey.id}>
          <div className="survey-card__top"><span className={`status status--${survey.status}`}>{survey.status === 'published' ? 'Lista para responder' : 'Borrador'}</span><span>{survey.questions.length} {survey.questions.length === 1 ? 'pregunta' : 'preguntas'}</span></div>
          <h2>{survey.title}</h2>
          <p>{survey.description || 'Sin descripción.'}</p>
          <div className="survey-card__metric"><strong>{count}</strong><span>{count === 1 ? 'respuesta' : 'respuestas'}</span></div>
          <div className="survey-card__actions">
            <Button variant="secondary" icon="edit" onClick={() => onOpen(survey.id)}>Editar</Button>
            <Button variant="ghost" onClick={() => onRespond(survey.id)}>Responder</Button>
            <Button variant="ghost" icon="results" onClick={() => onResults(survey.id)} aria-label="Ver resultados" />
            <Button variant="dangerGhost" icon="trash" onClick={() => onDelete(survey.id)} aria-label="Eliminar encuesta" />
          </div>
        </article>
      })}
    </div>}
  </main>
}

function QuestionEditor({ question, index, count, error = {}, onChange, onMove, onDuplicate, onDelete }) {
  const update = (patch) => onChange({ ...question, ...patch })
  const showOptions = ['single', 'multiple'].includes(question.type)
  return <article className="question-card">
    <div className="question-card__number">{index + 1}</div>
    <div className="question-card__body">
      <div className="field-row">
        <label className="field field--grow"><span>Pregunta</span><input value={question.label} onChange={(event) => update({ label: event.target.value })} placeholder="¿Qué queremos consultar?" aria-invalid={Boolean(error.label)} /></label>
        <label className="field field--type"><span>Tipo de respuesta</span><select value={question.type} onChange={(event) => update({ type: event.target.value })}>{QUESTION_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label>
      </div>
      <FieldError>{error.label}</FieldError>
      <label className="field"><span>Ayuda <em>opcional</em></span><input value={question.description} onChange={(event) => update({ description: event.target.value })} placeholder="Agrega contexto para responder mejor" /></label>
      {showOptions && <div className="options-editor"><span className="field-label">Alternativas</span>{question.options.map((option, optionIndex) => <div className="option-row" key={optionIndex}>
        <span className={question.type === 'single' ? 'radio-mark' : 'check-mark'} />
        <input value={option} onChange={(event) => update({ options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })} aria-label={`Alternativa ${optionIndex + 1}`} />
        <button className="icon-button" onClick={() => update({ options: question.options.filter((_, itemIndex) => itemIndex !== optionIndex) })} aria-label={`Eliminar alternativa ${optionIndex + 1}`}><Icon name="trash" /></button>
      </div>)}<button className="text-button" onClick={() => update({ options: [...question.options, `Opción ${question.options.length + 1}`] })}><Icon name="plus" />Agregar alternativa</button><FieldError>{error.options}</FieldError></div>}
      <footer className="question-card__footer">
        <label className="switch"><input type="checkbox" checked={question.required} onChange={(event) => update({ required: event.target.checked })} /><span />Obligatoria</label>
        <div className="question-tools">
          <button className="icon-button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Subir pregunta"><Icon name="chevronUp" /></button>
          <button className="icon-button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Bajar pregunta"><Icon name="chevronDown" /></button>
          <button className="icon-button" onClick={onDuplicate} aria-label="Duplicar pregunta"><Icon name="copy" /></button>
          <button className="icon-button icon-button--danger" onClick={onDelete} disabled={count === 1} aria-label="Eliminar pregunta"><Icon name="trash" /></button>
        </div>
      </footer>
    </div>
  </article>
}

function Builder({ survey, onBack, onSave, onPreview }) {
  const [draft, setDraft] = useState(structuredClone(survey))
  const [errors, setErrors] = useState({})
  const updateQuestions = (questions) => setDraft({ ...draft, questions: questions.map((question, position) => ({ ...question, position })) })
  const save = (status = draft.status) => {
    const found = validateSurvey(draft)
    setErrors(found)
    if (Object.keys(found).length) return
    onSave({ ...draft, status, updatedAt: new Date().toISOString() })
  }
  const move = (index, direction) => {
    const next = [...draft.questions]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    updateQuestions(next)
  }
  return <main className="page page--builder">
    <header className="editor-bar"><button className="back-button" onClick={onBack}><Icon name="back" />Encuestas</button><div className="editor-bar__actions"><Button variant="ghost" onClick={() => onPreview(draft)}>Vista previa</Button><Button variant="secondary" onClick={() => save('draft')}>Guardar borrador</Button><Button onClick={() => save('published')}>Dejar lista para responder</Button></div></header>
    <section className="survey-intro-card">
      <label className="field"><span>Título de la encuesta</span><input className="title-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-invalid={Boolean(errors.title)} /></label>
      <FieldError>{errors.title}</FieldError>
      <label className="field"><span>Descripción <em>opcional</em></span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Explica por qué se realiza esta consulta y cómo se usarán las respuestas." rows="3" /></label>
    </section>
    <section className="questions-stack" aria-label="Preguntas de la encuesta">
      {draft.questions.map((question, index) => <QuestionEditor key={question.id} question={question} index={index} count={draft.questions.length} error={errors[question.id]} onChange={(next) => updateQuestions(draft.questions.map((item) => item.id === question.id ? next : item))} onMove={(direction) => move(index, direction)} onDuplicate={() => updateQuestions([...draft.questions.slice(0, index + 1), { ...structuredClone(question), id: id('pregunta') }, ...draft.questions.slice(index + 1)])} onDelete={() => updateQuestions(draft.questions.filter((item) => item.id !== question.id))} />)}
    </section>
    <button className="add-question" onClick={() => updateQuestions([...draft.questions, emptyQuestion(draft.questions.length)])}><Icon name="plus" /><span><strong>Agregar pregunta</strong><small>Texto, alternativas, número o fecha</small></span></button>
  </main>
}

function ResponseField({ question, value, error, onChange }) {
  const common = { id: question.id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${question.id}-error` : undefined }
  let control
  if (question.type === 'long') control = <textarea {...common} value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows="5" />
  else if (question.type === 'number') control = <input {...common} type="number" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
  else if (question.type === 'date') control = <input {...common} type="date" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
  else if (question.type === 'single') control = <div className="choice-list">{question.options.filter(Boolean).map((option) => <label className="choice" key={option}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>
  else if (question.type === 'multiple') control = <div className="choice-list">{question.options.filter(Boolean).map((option) => <label className="choice" key={option}><input type="checkbox" checked={(value ?? []).includes(option)} onChange={(event) => onChange(event.target.checked ? [...(value ?? []), option] : (value ?? []).filter((item) => item !== option))} /><span>{option}</span></label>)}</div>
  else control = <input {...common} type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
  return <fieldset className="response-field"><legend>{question.label}{question.required && <strong aria-label="obligatoria"> *</strong>}</legend>{question.description && <p>{question.description}</p>}{control}<FieldError>{error}</FieldError></fieldset>
}

function Respond({ survey, preview = false, onBack, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const found = validateAnswers(survey, answers)
    setErrors(found)
    if (Object.keys(found).length) return
    if (preview) return
    onSubmit({ id: id('respuesta'), surveyId: survey.id, submittedAt: new Date().toISOString(), answers })
    setSent(true)
  }
  if (sent) return <main className="response-page"><section className="success-card"><div><Icon name="check" /></div><h1>Respuesta registrada</h1><p>Gracias por participar. Tu respuesta quedó guardada.</p><Button onClick={onBack}>Volver a las encuestas</Button></section></main>
  return <main className="response-page">
    <header className="response-header"><button className="back-button" onClick={onBack}><Icon name="back" />Volver</button>{preview && <span className="preview-badge">Vista previa</span>}</header>
    <form className="response-form" onSubmit={submit} noValidate>
      <div className="response-form__heading"><p className="eyebrow">Encuestador</p><h1>{survey.title}</h1>{survey.description && <p>{survey.description}</p>}<small><strong>*</strong> indica una pregunta obligatoria</small></div>
      {survey.questions.map((question) => <ResponseField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />)}
      <Button type="submit" disabled={preview}>Enviar respuesta</Button>
      {preview && <p className="preview-note">El envío está desactivado en la vista previa.</p>}
    </form>
  </main>
}

function Results({ survey, responses, onBack }) {
  const download = () => {
    const csv = `\uFEFF${responsesToCsv(survey, responses)}`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `${slugify(survey.title)}-respuestas.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return <main className="page page--wide">
    <header className="editor-bar"><button className="back-button" onClick={onBack}><Icon name="back" />Encuestas</button><Button icon="download" onClick={download} disabled={!responses.length}>Exportar CSV</Button></header>
    <div className="results-heading"><p className="eyebrow">Resultados</p><h1>{survey.title}</h1><p><strong>{responses.length}</strong> {responses.length === 1 ? 'respuesta registrada' : 'respuestas registradas'}</p></div>
    {!responses.length ? <section className="empty-state empty-state--compact"><div className="empty-state__icon"><Icon name="results" /></div><h2>Todavía no hay respuestas</h2><p>Cuando alguien complete la encuesta, sus respuestas aparecerán aquí.</p></section> : <div className="table-wrap"><table><thead><tr><th>Fecha</th>{survey.questions.map((question) => <th key={question.id}>{question.label}</th>)}</tr></thead><tbody>{responses.map((response) => <tr key={response.id}><td>{new Date(response.submittedAt).toLocaleString('es-CL')}</td>{survey.questions.map((question) => <td key={question.id}>{formatAnswer(response.answers[question.id])}</td>)}</tr>)}</tbody></table></div>}
  </main>
}

function App() {
  const [data, setData] = useState(initialState())
  const [store, setStore] = useState(null)
  const [saveStatus, setSaveStatus] = useState('loading')
  const [route, setRoute] = useState({ name: 'list' })
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const saveTimer = useRef(null)

  useEffect(() => {
    createStore().then(async (nextStore) => {
      setStore(nextStore)
      setData(await nextStore.load())
      setSaveStatus('saved')
    }).catch((error) => {
      console.error(error)
      setSaveStatus('error')
    })
  }, [])

  useEffect(() => {
    if (!store || saveStatus === 'loading') return
    clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(() => store.save(data).then(() => setSaveStatus('saved')).catch(() => setSaveStatus('error')), 350)
    return () => clearTimeout(saveTimer.current)
  }, [data, store])

  const survey = useMemo(() => data.surveys.find((item) => item.id === route.id) ?? route.survey, [data.surveys, route])
  const create = () => {
    const next = emptySurvey()
    setData({ ...data, surveys: [...data.surveys, next] })
    setRoute({ name: 'builder', id: next.id })
  }
  const saveSurvey = (next) => {
    setData({ ...data, surveys: data.surveys.map((item) => item.id === next.id ? next : item) })
    setRoute({ name: 'list' })
  }
  const remove = (surveyId) => {
    const responses = { ...data.responses }
    delete responses[surveyId]
    setData({ ...data, surveys: data.surveys.filter((item) => item.id !== surveyId), responses })
    setDeleteCandidate(null)
  }
  const submit = (response) => setData({ ...data, responses: { ...data.responses, [response.surveyId]: [...(data.responses[response.surveyId] ?? []), response] } })

  if (saveStatus === 'loading') return <div className="loading"><span /><p>Preparando Encuestador…</p></div>
  return <div className="app-shell">
    <div className="sync-indicator" data-status={saveStatus}><span />{saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'error' ? 'No se pudo guardar' : `Guardado en ${store?.label}`}</div>
    {route.name === 'list' && <SurveyList surveys={data.surveys} responses={data.responses} onCreate={create} onOpen={(id) => setRoute({ name: 'builder', id })} onRespond={(id) => setRoute({ name: 'respond', id })} onResults={(id) => setRoute({ name: 'results', id })} onDelete={setDeleteCandidate} />}
    {route.name === 'builder' && survey && <Builder survey={survey} onBack={() => setRoute({ name: 'list' })} onSave={saveSurvey} onPreview={(draft) => setRoute({ name: 'preview', survey: draft, returnId: survey.id })} />}
    {route.name === 'preview' && survey && <Respond survey={survey} preview onBack={() => setRoute({ name: 'builder', id: route.returnId })} />}
    {route.name === 'respond' && survey && <Respond survey={survey} onBack={() => setRoute({ name: 'list' })} onSubmit={submit} />}
    {route.name === 'results' && survey && <Results survey={survey} responses={data.responses[survey.id] ?? []} onBack={() => setRoute({ name: 'list' })} />}
    <ConfirmDialog open={Boolean(deleteCandidate)} onCancel={() => setDeleteCandidate(null)} onConfirm={() => remove(deleteCandidate)} />
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
