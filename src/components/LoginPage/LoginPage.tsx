/**
 * Страница входа (`/login`): шлюз по состоянию сессии.
 * Пока токен проверяется — заглушка; при уже открытой сессии — редирект на главную;
 * иначе показывается форма SMS-авторизации.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../desk/hooks'
import { PATHS } from '../../auth/paths'
import { SessionChecking } from '../SessionChecking/SessionChecking'
import { SupportLogin } from '../SupportLogin/SupportLogin'
import './LoginPage.scss'

/** Маршрут логина: проверка сессии, редирект авторизованных или форма входа. */
export function LoginPage() {
  const { authGate } = useAuth()
  // Пока восстанавливаем SMS-сессию, не показываем форму и не редиректим.
  if (authGate === 'checking') return <SessionChecking />
  // Уже вошли — на главную, replace чтобы «Назад» не возвращал на логин.
  if (authGate === 'app') return <Navigate to={PATHS.home} replace />
  return (
    <div className="oki-app app">
      <SupportLogin />
    </div>
  )
}
