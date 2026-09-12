/**
 * Повтор отправки кода верификации: канал sms / call / tg-gateway
 * из названия плитки или из {{channel}} в теле.
 */
import type { SavedMethod } from './types'

/** Pathname API без query. */
export const VERIFICATION_RESEND_PATH = '/support/verification-code/resend'

/** Канал API по названию плитки resend verification-code. */
export function verificationChannelForMethod(m: SavedMethod): string | null {
  const t = `${m.buttonLabel} ${m.name}`.toLowerCase()
  if (t.includes('телеграм')) return 'tg-gateway'
  if (t.includes('звонок')) return 'call'
  if (t.includes('смс')) return 'sms'
  return null
}

/** Операция resend кода: путь заканчивается на VERIFICATION_RESEND_PATH. */
export function isVerificationResendMethod(m: SavedMethod): boolean {
  return m.path.replace(/\?.*$/, '').endsWith(VERIFICATION_RESEND_PATH)
}

/** Подставляет в тело запроса канал по названию плитки (legacy). Если в теле {{channel}} — канал из UI. */
export function withVerificationChannelBody(m: SavedMethod): SavedMethod {
  if (!isVerificationResendMethod(m) || !m.body?.includes('"channel"')) return m
  if (m.body.includes('{{channel}}')) return m
  const channel = verificationChannelForMethod(m)
  if (!channel) return m
  const body = m.body.replace(/"channel"\s*:\s*"[^"]*"/, `"channel": "${channel}"`)
  if (body === m.body) return m
  const tileParamIds = m.tileParamIds?.filter((id) => id !== 'channel')
  return {
    ...m,
    body,
    tileParamIds: tileParamIds?.length ? tileParamIds : undefined,
  }
}
