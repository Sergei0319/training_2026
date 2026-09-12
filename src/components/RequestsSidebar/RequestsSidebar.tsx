/**
 * Правая колонка главной: сетка кнопок быстрых запросов (MethodButtonGrid)
 * и подсказка про настройки отдельного запроса.
 */
import { MethodButtonGrid } from '../MethodButtonGrid/MethodButtonGrid'
import './RequestsSidebar.scss'

/** Сайдбар «Запросы»: прокручиваемый список плиток операций. */
export function RequestsSidebar() {
  return (
    <aside className="oki-sidebar">
      <section className="panel oki-sidebar__panel">
        <h2 className="oki-section-title">Запросы</h2>
        <p className="muted oki-sidebar__hint">
          ⚙ — настройки запроса (удаление — внутри окна). Параметры задаются в запросе и в окне настроек.
        </p>
        <div className="oki-sidebar__scroll">
          <MethodButtonGrid />
        </div>
      </section>
    </aside>
  )
}
