export const SDK_VERSION = '0.1.0'
export const SHELL_ORIGINS = Object.freeze(['app://espacio', 'http://localhost:5173'])
export const READY = 'espacio:ready'
export const OPEN = 'espacio:open'
export const FRAME = Object.freeze({ HELLO: 'hello', REQUEST: 'req', RESPONSE: 'res', ERROR: 'err', EVENT: 'ev' })
export const METHOD = Object.freeze({ FETCH: 'fetch', UI_CONFIRM: 'ui.confirm', UI_NOTIFY: 'ui.notify' })
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024
export const TIMEOUT_MS = 30_000
