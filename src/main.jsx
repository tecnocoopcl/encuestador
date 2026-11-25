import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { isSection, validateAnswers } from './model.js'
import { cerrarSesion, fetchConSesion, iniciarSesion, retomarSesion } from './sesion.js'
import './styles.css'

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://api.tecnocooperativa.cl').replace(/\/+$/, '')
const ErrorText = ({ children }) => children ? <p className="field-error" role="alert">{children}</p> : null

function ResponseField({ question, value, error, onChange }) {
  const common = { id: question.id, 'aria-invalid': Boolean(error) }
  let control
  if (question.type === 'long') control = <textarea {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows="5" />
  else if (question.type === 'number') control = <input {...common} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  else if (question.type === 'date') control = <input {...common} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  else if (question.type === 'single') control = <div className="choice-list">{question.options.filter(Boolean).map((option) => <label className="choice" key={option}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>
  else if (question.type === 'multiple') control = <div className="choice-list">{question.options.filter(Boolean).map((option) => <label className="choice" key={option}><input type="checkbox" checked={(value ?? []).includes(option)} onChange={(e) => onChange(e.target.checked ? [...(value ?? []), option] : (value ?? []).filter((item) => item !== option))} /><span>{option}</span></label>)}</div>
  else control = <input {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  return <fieldset className="response-field"><legend>{question.label}{question.required && <strong> *</strong>}</legend>{question.description && <p>{question.description}</p>}{control}<ErrorText>{error}</ErrorText></fieldset>
}

function Encuesta({ survey, webId }) {
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const found = validateAnswers(survey, answers)
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending'); setMessage('')
    try {
      // Siempre hay sesión: solidFetch agrega el token y la prueba DPoP que verifica la API.
      const response = await fetchConSesion(`${API_URL}/encuestador/encuestas/${encodeURIComponent(survey.id)}/respuestas`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) })
      if (response.status === 401) throw new Error('Tu sesión venció. Cierra sesión y vuelve a entrar para responder.')
      if (response.status === 403) throw new Error('Tu cuenta no puede responder esta encuesta.')
      if (!response.ok) throw new Error('No pudimos registrar tu respuesta. Inténtalo nuevamente.')
      setStatus('sent')
    } catch (error) { setStatus('error'); setMessage(error.message) }
  }
  if (status === 'sent') return <main className="response-page"><section className="success-card"><div aria-hidden="true">✓</div><h1>Respuesta registrada</h1><p>Gracias por participar. Tu respuesta quedó guardada en el Pod del creador de la encuesta.</p></section></main>
  return <main className="response-page"><form className="response-form" onSubmit={submit} noValidate>
    <div className="response-form__heading"><p className="eyebrow">Encuestador</p><h1>{survey.title}</h1>{survey.description && <p>{survey.description}</p>}<small><strong>*</strong> indica una pregunta obligatoria</small></div>
    {survey.questions.map((question) => isSection(question)
      ? <section className="response-section" key={question.id}><h2>{question.title}</h2>{question.description && <p>{question.description}</p>}</section>
      : <ResponseField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />)}
    <p className="session-note">{survey.anonymous
      ? 'Tu respuesta es anónima: comprobamos que eres socio, pero no guardamos quién respondió.'
      : <>Respondes como <code>{webId}</code>. Quien creó la encuesta verá tu WebID junto a tu respuesta.</>} <button type="button" className="link" onClick={() => cerrarSesion().then(() => location.reload())}>Cerrar sesión</button></p>
    {message && <p className="submit-error" role="alert">{message}</p>}
    <button className="button button--primary" disabled={status === 'sending'}>{status === 'sending' ? 'Enviando…' : 'Enviar respuesta'}</button>
  </form></main>
}

function Landing({ onOpen }) {
  const [id, setId] = useState('')
  return <main className="response-page"><section className="landing-card"><p className="eyebrow">Participación cooperativa</p><h1>Encuestador</h1><p>Abre el enlace que te compartieron o escribe el identificador de una encuesta.</p><form onSubmit={(e) => { e.preventDefault(); if (id.trim()) onOpen(id.trim()) }}><input value={id} onChange={(e) => setId(e.target.value)} placeholder="identificador-de-encuesta" aria-label="Identificador de encuesta" /><button className="button button--primary">Abrir encuesta</button></form></section></main>
}

function Ingreso({ survey }) {
  const [error, setError] = useState('')
  return <main className="response-page"><section className="landing-card"><p className="eyebrow">Solo para socios</p><h1>{survey.title}</h1>
    <p>{survey.access === 'list' ? 'Esta encuesta es para algunos socios de la cooperativa.' : 'Esta encuesta es para los socios de la cooperativa.'} Inicia sesión con tu cuenta para responderla.</p>
    {survey.anonymous && <p>Tu respuesta será anónima: solo comprobamos que puedes responder.</p>}
    <button className="button button--primary" onClick={() => iniciarSesion(survey.id).catch(() => setError('No pudimos abrir el inicio de sesión. Inténtalo nuevamente.'))}>Iniciar sesión</button>
    <ErrorText>{error}</ErrorText></section></main>
}

function App({ webId }) {
  const initialId = new URLSearchParams(location.search).get('encuesta') ?? ''
  const [surveyId, setSurveyId] = useState(initialId)
  const [survey, setSurvey] = useState(null)
  const [status, setStatus] = useState(initialId ? 'loading' : 'landing')
  useEffect(() => {
    if (!surveyId) return
    setStatus('loading')
    fetch(`${API_URL}/encuestador/encuestas/${encodeURIComponent(surveyId)}`)
      .then((response) => { if (!response.ok) throw new Error(); return response.json() })
      .then((value) => { setSurvey(value); setStatus('ready') })
      .catch(() => setStatus('missing'))
  }, [surveyId])
  const open = (id) => { const url = new URL(location.href); url.searchParams.set('encuesta', id); history.pushState({}, '', url); setSurveyId(id) }
  if (status === 'landing') return <Landing onOpen={open} />
  if (status === 'loading') return <main className="response-page"><div className="loading"><span /><p>Cargando encuesta…</p></div></main>
  if (status === 'missing') return <main className="response-page"><section className="success-card"><h1>Encuesta no disponible</h1><p>Revisa el enlace o solicita uno nuevo a quien creó la encuesta.</p><button className="button button--primary" onClick={() => setStatus('landing')}>Buscar otra encuesta</button></section></main>
  // Todas las encuestas son para socios: se responde con la sesión de la
  // cooperativa, y así la carpeta de respuestas no queda abierta a cualquiera.
  if (!webId) return <Ingreso survey={survey} />
  return <Encuesta survey={survey} webId={webId} />
}

// Primero se completa el regreso del proveedor (o se restaura la sesión): así
// el ?encuesta= pendiente ya está en la URL cuando App lo lee.
retomarSesion().then((webId) => createRoot(document.getElementById('root')).render(<React.StrictMode><App webId={webId} /></React.StrictMode>))
