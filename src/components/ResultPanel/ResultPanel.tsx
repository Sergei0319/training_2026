/**
 * Панель ответа активного запроса: статус, сводка, структурированный вид,
 * ссылки кабинета пользователя и опциональный сырой JSON.
 */
import { BookResponseView } from '../BookResponseView/BookResponseView'
import { UserCabinetLinks } from '../UserCabinetLinks/UserCabinetLinks'
import { useRunner } from '../../desk/hooks'
import './ResultPanel.scss'

/** Отображение результата выбранной записи журнала (или пустое состояние). */
export function ResultPanel() {
  const { active, lkData, showLkLinks, showRaw, setShowRaw, closeActiveResult } = useRunner()
  return (
    <section className="panel panel--grow">
      <div className="result-head">
        <h2 className="panel__title">Результат</h2>
        {active ? (
          <div className="result-head__actions">
            <span className={`pill ${active.ok ? 'pill--ok' : 'pill--err'}`}>
              {active.ok ? 'успех' : 'ошибка'}
            </span>
            <button
              type="button"
              className="result-head__close"
              title="Закрыть запрос"
              aria-label="Закрыть запрос"
              onClick={closeActiveResult}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : null}
      </div>
      {active ? (
        <>
          <p className="result-meta">
            <strong>{active.action}</strong>
            <span className="result-meta__sep">·</span>
            {active.at}
          </p>
          <p className="result-summary">{active.summary}</p>
          {active.data !== '' ? (
            <>
              {/* Ссылки ЛК только если runner распознал данные пользователя. */}
              {showLkLinks ? <UserCabinetLinks data={lkData!} /> : null}
              <BookResponseView data={active.data} />
              <label className="raw-toggle">
                <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} />
                Показать сырой JSON
              </label>
              {showRaw ? (
                <pre className="raw-json">
                  {typeof active.data === 'string' ? active.data : JSON.stringify(active.data, null, 2)}
                </pre>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p className="muted">Выполните операцию — ответ появится здесь.</p>
      )}
    </section>
  )
}
