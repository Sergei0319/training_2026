/**
 * Базовые URL API: в production — из env, в dev — Vite-прокси (`/doki-proxy`, `/okidoki-proxy`),
 * чтобы не упираться в CORS при запросах с localhost.
 */
import type { ApiHostKind } from '../methods/types'

/** Базовый URL без завершающего слэша для api.doki.online. В dev — прокси Vite. */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return '/doki-proxy'
}

/** Для api.okidoki.ru: отдельный env или прокси в dev. */
export function getOkidokiApiBase(): string {
  const fromEnv = import.meta.env.VITE_OKIDOKI_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return '/okidoki-proxy'
}

/**
 * Выбирает базу по хосту сохранённой операции (`doki.online` vs `okidoki.ru`).
 */
export function getApiBaseForHost(host: ApiHostKind): string {
  return host === 'okidoki.ru' ? getOkidokiApiBase() : getApiBase()
}
