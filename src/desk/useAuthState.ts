/**
 * Состояние авторизации кабинета: гейт, Bearer, владелец сессии, логин/логаут.
 * При монтировании чистим legacy-токен и проверяем sessionStorage через `/support/auth/me`.
 */
import { useCallback, useEffect, useState } from 'react'
import { fetchSupportAuthMe, supportApiFetch } from '../auth/supportApiClient'
import {
  clearLegacyBearerToken,
  clearSupportSession,
  loadSupportSession,
  saveSupportSession,
  type SupportSession,
} from '../auth/supportSession'
import type { AuthGate } from './types'

/**
 * Хук сессии. `cancelled` в эффекте отсекает гонку: ответ `/me` после размонтирования
 * или повторного запуска эффекта не должен переписать уже сброшенный гейт.
 */
export function useAuthState() {
  const [authGate, setAuthGate] = useState<AuthGate>('checking')
  const [sessionOwner, setSessionOwner] = useState('')
  const [bearerToken, setBearerToken] = useState('')

  const applyAuthenticatedSession = useCallback((session: SupportSession) => {
    saveSupportSession({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      owner: session.owner,
    })
    setBearerToken(session.accessToken)
    setSessionOwner(session.owner)
    setAuthGate('app')
  }, [])

  const forceLogin = useCallback(() => {
    clearSupportSession()
    setBearerToken('')
    setSessionOwner('')
    setAuthGate('login')
  }, [])

  const logoutSupport = useCallback(async () => {
    const token = bearerToken.trim()
    if (token) {
      try {
        await supportApiFetch('/support/auth/logout', { method: 'POST' }, { accessToken: token })
      } catch {
        /* ignore */
      }
    }
    forceLogin()
  }, [bearerToken, forceLogin])

  useEffect(() => {
    clearLegacyBearerToken()
    let cancelled = false
    ;(async () => {
      const stored = loadSupportSession()
      if (!stored?.accessToken) {
        if (!cancelled) forceLogin()
        return
      }
      const me = await fetchSupportAuthMe(stored.accessToken, forceLogin)
      if (!me) {
        clearSupportSession()
        if (!cancelled) forceLogin()
        return
      }
      if (!cancelled) {
        applyAuthenticatedSession({
          ...stored,
          owner: me.owner || stored.owner,
          expiresAt: me.expiresAt || stored.expiresAt,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyAuthenticatedSession, forceLogin])

  return {
    authGate,
    sessionOwner,
    bearerToken,
    applyAuthenticatedSession,
    forceLogin,
    logoutSupport,
  }
}
