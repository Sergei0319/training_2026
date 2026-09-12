/**
 * Секция «Параметры запроса»: выбор операции, кнопка запуска и полный редактор метода.
 */
import { MethodEditor } from '../MethodEditor/MethodEditor'
import { useMethods, useRunner } from '../../desk/hooks'
import { firstMethodError, validateSavedMethod } from '../../forms/validateMethod'
import './MethodEditSection.scss'

/** Панель редактирования выбранной операции на вкладке «Операции». */
export function MethodEditSection() {
  const { methods, selected, selectedId, setSelectedId, updateMethod, deleteSelected } = useMethods()
  const { busy, runMethod } = useRunner()
  const configError = selected ? firstMethodError(validateSavedMethod(selected)) : null
  return (
    <section className="panel">
      <div className="result-head">
        <h2 className="panel__title">Параметры запроса</h2>
        {selected ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || Boolean(configError)}
            onClick={() => void runMethod(selected)}
          >
            Выполнить
          </button>
        ) : null}
      </div>
      {configError ? (
        <p className="field__error" role="alert">
          {configError}
        </p>
      ) : null}
      <label className="field">
        <span className="field__label">Операция для редактирования</span>
        <select
          className="field__input"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)} // пустая опция → нет выбранной операции
        >
          {methods.length === 0 ? <option value="">— нет операций —</option> : null}
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.buttonLabel || m.name} · {m.method} {m.path}
            </option>
          ))}
        </select>
      </label>
      <MethodEditor method={selected} onChange={updateMethod} onDelete={deleteSelected} />
    </section>
  )
}
