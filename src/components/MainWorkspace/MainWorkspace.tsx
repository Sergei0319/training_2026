/**
 * Главная страница кабинета: журнал запросов, панель результата и боковая сетка быстрых операций.
 */
import { JournalPanel } from '../JournalPanel/JournalPanel'
import { ResultPanel } from '../ResultPanel/ResultPanel'
import { RequestsSidebar } from '../RequestsSidebar/RequestsSidebar'
import './MainWorkspace.scss'

/** Рабочая область: слева журнал + ответ API, справа кнопки запросов. */
export function MainWorkspace() {
  return (
    <>
      <p className="oki-lead">
        Быстрые операции к API в виде кнопок. Кликните запрос — выполните операцию и посмотрите ответ.
        Таблица со списком операций, фильтром и сортировкой — в разделе «Операции». Импорт и редактор — в «Настройках».
        Доступ по SMS-сессии (кнопка «Выйти»).
      </p>
      <div className="oki-two-col oki-two-col--result-left">
        <div className="oki-stack oki-stack--left">
          <JournalPanel />
          <ResultPanel />
        </div>
        <RequestsSidebar />
      </div>
    </>
  )
}
