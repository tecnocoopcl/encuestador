import { normalizeState } from './model.js'
import { connect } from './vendor/espacio-sdk/index.js'

const LOCAL_KEY = 'encuestador:data:v1'
const JSON_TYPE = 'application/json; charset=utf-8'

function localStore() {
  return {
    kind: 'local',
    label: 'Este dispositivo',
    async load() {
      try {
        return normalizeState(JSON.parse(localStorage.getItem(LOCAL_KEY)))
      } catch {
        return normalizeState(null)
      }
    },
    async save(value) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(value))
    },
  }
}

async function solidStore(espacio) {
  const url = espacio.paths.app('encuestador.json')
  return {
    kind: 'solid',
    label: 'Tu Solid Pod',
    async load() {
      const response = await espacio.fetch(url, { headers: { accept: 'application/json' } })
      if (response.status === 404) return normalizeState(null)
      if (!response.ok) throw new Error(`No fue posible leer el Pod (${response.status}).`)
      return normalizeState(await response.json())
    },
    async save(value) {
      const response = await espacio.fetch(url, {
        method: 'PUT',
        headers: { 'content-type': JSON_TYPE },
        body: `${JSON.stringify(value, null, 2)}\n`,
      })
      if (!response.ok) throw new Error(`No fue posible guardar en el Pod (${response.status}).`)
    },
  }
}

export async function createStore() {
  try {
    const espacio = await connect({ timeout: 1200 })
    if (espacio?.session) return solidStore(espacio)
  } catch (error) {
    console.warn('[encuestador] Espacio no disponible; se usará almacenamiento local.', error)
  }
  return localStore()
}
