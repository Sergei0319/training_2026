/**
 * Шапка: меню разделов Главная / Операции / Настройки (экзамен 2.1, навигация).
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../desk/hooks'
import { PATHS } from '../../auth/paths'
import './AppHeader.scss'

/**
 * Класс вкладки: активный маршрут подсвечивается модификатором --on.
 */
function navClass({ isActive }: { isActive: boolean }) {
  return `oki-tabs__btn${isActive ? ' oki-tabs__btn--on' : ''}`
}

/** Верхняя панель навигации авторизованной зоны. */
export function AppHeader() {
  const { sessionOwner, logoutSupport } = useAuth()
  return (
    <header className="oki-app__bar">
      <div className="oki-brand">
        <span className="oki-brand__logo">Личный кабинет техподдержки ОкиДоки</span>
      </div>
      <nav className="oki-tabs" aria-label="Разделы">
        {sessionOwner ? (
          <span className="oki-session-user" title="Специалист поддержки">
            {sessionOwner}
          </span>
        ) : null}
        <button type="button" className="btn oki-logout" onClick={() => void logoutSupport()}>
          Выйти
        </button>
        <NavLink to={PATHS.home} end className={navClass}>
          Главная
        </NavLink>
        <NavLink to={PATHS.operations} className={navClass}>
          Операции
        </NavLink>
        <NavLink to={PATHS.settings} className={navClass}>
          <span aria-hidden="true" className="oki-tabs__icon">⚙</span>
          Настройки
        </NavLink>
      </nav>
    </header>
  )
}
