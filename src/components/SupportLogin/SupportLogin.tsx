/**
 * Форма SMS-входа специалиста поддержки: шаг телефона, затем код.
 * Запросы идут в support API; после успешного ответа сессия пишется через applyAuthenticatedSession.
 */
import { useCallback, useEffect, useState } from 'react'
import { supportApiFetch } from '../../auth/supportApiClient'
import { useAuth } from '../../desk/hooks'
import { FieldError } from '../../forms/FieldError'
import { validatePhone, validateSmsCode } from '../../forms/validateLogin'
import './SupportLogin.scss'

/** Пауза перед повторной отправкой SMS, секунды. */
const RESEND_SECONDS = 60

/**
 * Двухшаговая авторизация: запрос кода на телефон и вход по SMS.
 */
export function SupportLogin() {
  const { applyAuthenticatedSession } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [resendIn, setResendIn] = useState(0)

  // Тик таймера повторной отправки: каждую секунду уменьшаем resendIn.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  /**
   * Валидация номера и POST /verification-code.
   * При успехе переключаемся на шаг ввода кода и запускаем таймер resend.
   */
  const sendCode = useCallback(async () => {
    const fieldError = validatePhone(phone)
    setPhoneError(fieldError ?? '')
    setError('')
    if (fieldError) return
    setBusy(true)
    try {
      const res = await supportApiFetch('/verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          purpose: 'support_admin_auth',
          channel: 'sms',
        }),
      })
      if (!res.ok) {
        throw new Error(String(res.status))
      }
      setStep('code')
      setResendIn(RESEND_SECONDS)
    } catch {
      setError('Не удалось отправить код. Проверьте номер и попробуйте снова.')
    } finally {
      setBusy(false)
    }
  }, [phone])

  /**
   * Валидация SMS-кода и POST /support/auth.
   * В DEV к ошибке добавляется фрагмент тела ответа; токен сохраняется в сессию.
   */
  const submitLogin = useCallback(async () => {
    const fieldError = validateSmsCode(code)
    setCodeError(fieldError ?? '')
    setError('')
    if (fieldError) return
    setBusy(true)
    try {
      const res = await supportApiFetch('/support/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          verification_code: code.trim(),
        }),
      })
      const bodyText = await res.text()
      if (!res.ok) {
        // В разработке показываем статус и кусок тела — удобнее отлаживать whitelist/код.
        const hint =
          import.meta.env.DEV && bodyText.trim()
            ? ` (${res.status}: ${bodyText.slice(0, 120)})`
            : ''
        if (res.status === 403 || res.status === 406 || res.status === 408) {
          setError(`Неверный код или нет доступа${hint}`)
        } else {
          setError(`Не удалось войти. Попробуйте снова.${hint}`)
        }
        return
      }
      let parsed: {
        access_token?: string
        expires_in?: number
        owner?: string
      }
      try {
        parsed = JSON.parse(bodyText) as typeof parsed
      } catch {
        setError('Не удалось войти. Попробуйте снова.')
        return
      }
      const accessToken = parsed.access_token?.trim()
      if (!accessToken) {
        setError('Не удалось войти. Попробуйте снова.')
        return
      }
      applyAuthenticatedSession({
        accessToken,
        owner: parsed.owner?.trim() || '',
        expiresAt: parsed.expires_in
          ? new Date(Date.now() + parsed.expires_in * 1000).toISOString()
          : '',
      })
    } catch {
      setError('Не удалось войти. Попробуйте снова.')
    } finally {
      setBusy(false)
    }
  }, [applyAuthenticatedSession, code, phone])

  return (
    <div className="oki-login">
      <section className="panel oki-login__card">
        <h1 className="oki-login__title">Вход для техподдержки</h1>
        <p className="oki-lead oki-login__lead">
          Подтвердите рабочий номер телефона. Доступ есть только у специалистов из whitelist.
        </p>

        {step === 'phone' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendCode()
            }}
          >
            <label className="field">
              <span className="field__label">Номер телефона</span>
              <input
                className={`field__input${phoneError ? ' field__input--error' : ''}`}
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setPhoneError('')
                }}
                placeholder="+79001234567"
                disabled={busy}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'login-phone-error' : undefined}
              />
              <FieldError id="login-phone-error" message={phoneError} />
            </label>
            <button type="submit" className="btn btn--primary oki-login__submit" disabled={busy}>
              Получить код
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submitLogin()
            }}
          >
            <p className="muted oki-hint">Код отправлен на {phone.trim()}</p>
            <label className="field">
              <span className="field__label">Код из SMS</span>
              <input
                className={`field__input${codeError ? ' field__input--error' : ''}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setCodeError('')
                }}
                placeholder="1234"
                disabled={busy}
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? 'login-code-error' : undefined}
              />
              <FieldError id="login-code-error" message={codeError} />
            </label>
            <button type="submit" className="btn btn--primary oki-login__submit" disabled={busy}>
              Войти
            </button>
            <div className="oki-login__secondary">
              <button
                type="button"
                className="btn"
                disabled={busy || resendIn > 0}
                onClick={() => void sendCode()}
              >
                {resendIn > 0 ? `Отправить снова (${resendIn} с)` : 'Отправить код снова'}
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  setStep('phone')
                  setCode('')
                  setError('')
                  setCodeError('')
                }}
              >
                Другой номер
              </button>
            </div>
          </form>
        )}

        {error ? <p className="oki-login__error">{error}</p> : null}
      </section>
    </div>
  )
}
