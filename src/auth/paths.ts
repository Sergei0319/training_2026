/**
 * Канонические пути SPA. Единый объект, чтобы ссылки, редиректы и `Route`
 * не расходились из‑за «магических» строк.
 */

/**
 * Маршруты кабинета. `as const` фиксирует литеральные типы значений.
 */
export const PATHS = {
  home: '/',
  login: '/login',
  operations: '/operations',
  settings: '/settings',
} as const
