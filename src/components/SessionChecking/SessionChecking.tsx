/**
 * Заглушка на время проверки SMS-сессии (restore из sessionStorage).
 * Используется LoginPage и RequireAuth, пока authGate === 'checking'.
 */
import './SessionChecking.scss'

/** Экран «Проверка сессии…» без формы и без редиректа. */
export function SessionChecking() {
  return (
    <div className="oki-app app">
      <p className="oki-lead oki-login__checking">Проверка сессии…</p>
    </div>
  )
}
