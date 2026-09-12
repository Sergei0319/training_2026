/**
 * HTTP-клиент к api.doki.online для support-сессии: Bearer, 401 и разбор `/support/auth/me`.
 * Токен в логах не печатаем — только передаём в заголовке.
 * Запросы идут через fetch (экзамен 2.2, API).
 */
import { getApiBase } from '../doki/apiBase'
import { loadSupportSession } from './supportSession'

/**
 * Доп. опции запроса: явный токен (логин ещё не в sessionStorage)
 * и колбэк сброса сессии при 401.
 */
export type SupportApiFetchOptions = {
  /** Явный токен (экран логина); иначе берётся из sessionStorage. */
  accessToken?: string
  /** Вызывается при 401 (истёкшая/отозванная сессия). */
  onUnauthorized?: () => void
}

/** Собирает абсолютный URL: база из `getApiBase` + путь с ведущим `/`. */
function buildUrl(path: string): string {
  const base = getApiBase()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

/**
 * HTTP к api.doki.online с Bearer support-сессии (без логирования токена).
 * Accept по умолчанию JSON; Authorization ставится только если токен непустой.
 */
export async function supportApiFetch(
  path: string,
  init: RequestInit = {},
  options: SupportApiFetchOptions = {},
): Promise<Response> {
  const token = (options.accessToken ?? loadSupportSession()?.accessToken ?? '').trim()
  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(buildUrl(path), { ...init, headers })
  // 401 отдаём вызывающему: сброс сессии решает UI, а не этот слой.
  if (res.status === 401 && options.onUnauthorized) {
    options.onUnauthorized()
  }
  return res
}

/**
 * Проверка живой сессии: GET `/support/auth/me`.
 * При ошибке сети/JSON или не-OK ответе возвращает `null`, чтобы вызывающий ушёл на логин.
 */
export async function fetchSupportAuthMe(
  accessToken: string,
  onUnauthorized?: () => void,
): Promise<{ owner: string; expiresAt?: string } | null> {
  const res = await supportApiFetch(
    '/support/auth/me',
    { method: 'GET' },
    { accessToken, onUnauthorized },
  )
  if (!res.ok) return null
  try {
    const data = (await res.json()) as { owner?: string; expires_at?: string }
    return {
      owner: typeof data.owner === 'string' ? data.owner : '',
      expiresAt: typeof data.expires_at === 'string' ? data.expires_at : undefined,
    }
  } catch {
    return null
  }
}
