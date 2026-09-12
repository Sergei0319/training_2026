/**
 * Журнал выполненных запросов на главной: список из runner.log.
 * Клик по записи делает её активной — ответ показывается в ResultPanel.
 */
import { useRunner } from '../../desk/hooks'
import './JournalPanel.scss'

/** Список операций журнала с индикатором успеха/ошибки и выделением activeId. */
export function JournalPanel() {
  const { log, activeId, setActiveId } = useRunner()
  return (
    <section className="panel">
      <h2 className="panel__title">Журнал</h2>
      <ul className="journal">
        {log.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`journal__btn ${item.id === activeId ? 'journal__btn--on' : ''}`}
              onClick={() => setActiveId(item.id)}
            >
              <span className={`journal__dot ${item.ok ? 'journal__dot--ok' : 'journal__dot--err'}`} />
              {item.action}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
