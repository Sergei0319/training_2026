/**
 * Корневой компонент: маршруты без перезагрузки страницы (экзамен 2.2, роутер)
 * и общий DeskProvider (экзамен 2.2, глобальное состояние).
 */
import './App.scss'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DeskProvider } from './desk/DeskProvider'
import { PATHS } from './auth/paths'
import { LoginPage } from './components/LoginPage/LoginPage'
import { RequireAuth } from './components/RequireAuth/RequireAuth'
import { SupportDesk } from './components/SupportDesk/SupportDesk'
import { MainWorkspace } from './components/MainWorkspace/MainWorkspace'
import { SettingsPage } from './components/SettingsPage/SettingsPage'
import { OperationsPage } from './components/OperationsPage/OperationsPage'

/**
 * Собирает дерево маршрутов. Неизвестный URL перенаправляется на главную,
 * чтобы не оставлять пустой экран после опечатки в адресе.
 */
export default function App() {
  return (
    <DeskProvider>
      <Routes>
        <Route path={PATHS.login} element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<SupportDesk />}>
            <Route path={PATHS.home} element={<MainWorkspace />} />
            <Route path={PATHS.operations} element={<OperationsPage />} />
            <Route path={PATHS.settings} element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={PATHS.home} replace />} />
      </Routes>
    </DeskProvider>
  )
}
