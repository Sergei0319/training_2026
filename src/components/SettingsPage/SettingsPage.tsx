/**
 * Страница «Настройки»: ключи/адреса API, импорт-экспорт операций и подробный редактор метода.
 * Значения живут в localStorage браузера.
 */
import { ApiAccessPanel } from '../ApiAccessPanel/ApiAccessPanel'
import { MethodsToolbar } from '../MethodsToolbar/MethodsToolbar'
import { MethodEditSection } from '../MethodEditSection/MethodEditSection'
import './SettingsPage.scss'

/** Сборка панелей настроек доступа и редактора сохранённых операций. */
export function SettingsPage() {
  return (
    <>
      <p className="oki-lead">
        Здесь хранятся ключи доступа к API и подробный редактор операций. Все значения сохраняются локально в этом
        браузере.
      </p>
      <ApiAccessPanel />
      <MethodsToolbar />
      <MethodEditSection />
    </>
  )
}
