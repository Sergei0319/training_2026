/**
 * Хранение support-сессии в sessionStorage (токен, срок, владелец).
 * sessionStorage сбрасывается при закрытии вкладки; доступ к хранилищу может быть запрещён (Safari private).
 */
const SS_ACCESS = 'doki_support_session_access_token'
const SS_EXPIRES = 'doki_support_session_expires_at'
const SS_OWNER = 'doki_support_session_owner'

/**
 * Локальная копия сессии: access-токен, ISO-время истечения, логин/owner с `/auth/me`.
 */
export type SupportSession = {
  accessToken: string
  expiresAt: string
  owner: string
}

function readSessionStorage(key: string): string {
  try {
    return sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function writeSessionStorage(key: string, value: string): void {
  try {
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/**
 * Читает сессию. Пустой токен или истёкший `expiresAt` считаются отсутствием сессии
 * (при истечении ключи сразу чистятся, чтобы не крутить мёртвый Bearer).
 */
export function loadSupportSession(): SupportSession | null {
  const accessToken = readSessionStorage(SS_ACCESS).trim()
  if (!accessToken) return null
  const expiresAt = readSessionStorage(SS_EXPIRES)
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt)
    if (!Number.isNaN(expiresMs) && expiresMs <= Date.now()) {
      clearSupportSession()
      return null
    }
  }
  return {
    accessToken,
    expiresAt,
    owner: readSessionStorage(SS_OWNER),
  }
}

/**
 * Пишет сессию. Если ISO-даты нет, срок можно задать через `expiresInSeconds`
 * (ответ логина часто отдаёт TTL, а не абсолютное время).
 */
export function saveSupportSession(session: {
  accessToken: string
  expiresAt?: string
  expiresInSeconds?: number
  owner?: string
}): void {
  writeSessionStorage(SS_ACCESS, session.accessToken)
  let expiresAt = session.expiresAt?.trim() || ''
  if (!expiresAt && session.expiresInSeconds) {
    expiresAt = new Date(Date.now() + session.expiresInSeconds * 1000).toISOString()
  }
  writeSessionStorage(SS_EXPIRES, expiresAt)
  writeSessionStorage(SS_OWNER, session.owner?.trim() || '')
}

/** Удаляет все три ключа сессии из sessionStorage. */
export function clearSupportSession(): void {
  writeSessionStorage(SS_ACCESS, '')
  writeSessionStorage(SS_EXPIRES, '')
  writeSessionStorage(SS_OWNER, '')
}

/** Удаляет устаревший Bearer из localStorage (до phone-auth). */
export function clearLegacyBearerToken(): void {
  try {
    localStorage.removeItem('doki_support_bearer_token')
  } catch {
    /* ignore */
  }
}
