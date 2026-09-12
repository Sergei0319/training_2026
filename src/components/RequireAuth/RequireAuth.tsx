/**
 * Защита вложенных маршрутов кабинета: без SMS-сессии уводим на логин.
 * Сохраняет текущий location в state.from, чтобы после входа можно было вернуться.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../desk/hooks'
import { PATHS } from '../../auth/paths'
import { SessionChecking } from '../SessionChecking/SessionChecking'

/** Guard: checking → заглушка, login → /login, иначе дочерние роуты. */
export function RequireAuth() {
  const { authGate } = useAuth()
  const location = useLocation()
  if (authGate === 'checking') return <SessionChecking />
  // Неавторизован: replace, чтобы стек истории не копил защищённые URL.
  if (authGate === 'login') {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }
  return <Outlet />
}
