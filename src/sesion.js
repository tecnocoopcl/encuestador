import {
  fetch as solidFetch,
  getDefaultSession,
  handleIncomingRedirect,
  login,
  logout,
} from '@inrupt/solid-client-authn-browser'

// Las encuestas solo para socios piden iniciar sesión con la identidad de la
// cooperativa. La API verifica el token y la prueba DPoP que agrega solidFetch;
// la web solo consigue la sesión.
export const PROVEEDOR = import.meta.env.VITE_SOLID_PROVEEDOR ?? 'https://pods.tecnocooperativa.cl'

// El proveedor vuelve a la raíz, sin ?encuesta=: se guarda para retomarla.
const ENCUESTA_PENDIENTE = 'encuestador-encuesta-pendiente'

export async function retomarSesion() {
  try {
    await handleIncomingRedirect({ restorePreviousSession: true })
  } catch (err) {
    console.warn(`No se pudo restaurar la sesión Solid: ${err.message}`)
  }
  const pendiente = sessionStorage.getItem(ENCUESTA_PENDIENTE)
  if (pendiente) {
    sessionStorage.removeItem(ENCUESTA_PENDIENTE)
    const url = new URL(location.href)
    if (!url.searchParams.get('encuesta')) {
      url.searchParams.set('encuesta', pendiente)
      history.replaceState({}, '', url)
    }
  }
  return webIdActual()
}

export function webIdActual() {
  const { info } = getDefaultSession()
  return info.isLoggedIn ? info.webId : null
}

export async function iniciarSesion(encuestaId) {
  sessionStorage.setItem(ENCUESTA_PENDIENTE, encuestaId)
  await login({
    oidcIssuer: PROVEEDOR,
    redirectUrl: `${location.origin}${location.pathname}`,
    clientName: 'Encuestador',
  })
}

export const cerrarSesion = () => logout()

export const fetchConSesion = (...args) => solidFetch(...args)
