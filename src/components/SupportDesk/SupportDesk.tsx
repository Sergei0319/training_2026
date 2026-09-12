/** Каркас после входа: шапка-меню и страницы через Outlet (экзамен 2.2, компоненты + роутер). */
import { AppHeader } from '../AppHeader/AppHeader'
import { Outlet } from 'react-router-dom'
import './SupportDesk.scss'

/** Layout авторизованной зоны: AppHeader + дочерний роут. */
export function SupportDesk() {
  return (
    <div className="oki-app app">
      <AppHeader />
      <Outlet />
    </div>
  )
}
