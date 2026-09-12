/**
 * Форма изменения операции (экзамен 2.1 CRUD: Update).
 * HTTP, хост, путь, query, тело и набор полей плитки.
 */
import { useMemo, useState } from 'react'
import { FieldError } from '../../forms/FieldError'
import { firstMethodError, validateSavedMethod } from '../../forms/validateMethod'
import type { ApiHostKind, SavedMethod } from '../../methods/types'
import { getEnabledTileParams, getInRequestTileParamIds, type TileParamId } from '../../methods/tileParams'
import { TileParamFieldsSection } from '../TileParamFieldsSection/TileParamFieldsSection'
import './MethodEditor.scss'

type Props = {
  method: SavedMethod | null
  onChange: (m: SavedMethod) => void
  onDelete: () => void
}

/** Обёртка: пустое состояние или форма редактирования выбранной операции. */
export function MethodEditor({ method, onChange, onDelete }: Props) {
  if (!method) {
    return <p className="method-editor__empty">Выберите операцию на панели выше или создайте новую.</p>
  }

  return <MethodEditorForm method={method} onChange={onChange} onDelete={onDelete} />
}

type FormProps = {
  method: SavedMethod
  onChange: (m: SavedMethod) => void
  onDelete: () => void
}

/** Поля операции и чекбоксы параметров плитки; изменения сразу пробрасываются в `onChange`. */
function MethodEditorForm({ method, onChange, onDelete }: FormProps) {
  /** Частичное обновление: новый объект метода с наложенным патчем. */
  const set = (patch: Partial<SavedMethod>) => onChange({ ...method, ...patch })

  const inRequest = useMemo(() => getInRequestTileParamIds(method), [method])
  /** Ключ «содержимого» метода: смена id/пути/тела/query сбрасывает локальный список галочек. */
  const enabledIdsSourceKey = useMemo(
    () =>
      `${method.id}\0${(method.tileParamIds ?? []).join(',')}\0${method.path}\0${method.body ?? ''}\0${JSON.stringify(method.query)}`,
    [method],
  )
  const [enabledIdsSource, setEnabledIdsSource] = useState(enabledIdsSourceKey)
  const [enabledIds, setEnabledIds] = useState<TileParamId[]>(() => {
    const enabled = getEnabledTileParams(method).map((d) => d.id)
    return enabled.length ? enabled : [...inRequest]
  })

  // Синхронизация во время рендера: при смене метода не ждём useEffect, чтобы не мигали старые галочки.
  if (enabledIdsSource !== enabledIdsSourceKey) {
    setEnabledIdsSource(enabledIdsSourceKey)
    const enabled = getEnabledTileParams(method).map((d) => d.id)
    setEnabledIds(enabled.length ? enabled : [...getInRequestTileParamIds(method)])
  }

  /** Пустой список не храним — `undefined` означает «взять параметры из шаблона запроса». */
  const syncTileParamIds = (ids: TileParamId[]) => {
    setEnabledIds(ids)
    set({ tileParamIds: ids.length ? ids : undefined })
  }

  const toggleParam = (id: TileParamId, on: boolean) => {
    const next = on
      ? enabledIds.includes(id)
        ? enabledIds
        : [...enabledIds, id]
      : enabledIds.filter((x) => x !== id)
    syncTileParamIds(next)
  }

  /** Правка одной ячейки query-строки (ключ или значение). */
  const updateQueryRow = (i: number, field: 'key' | 'value', v: string) => {
    const q = [...method.query]
    q[i] = { ...q[i], [field]: v }
    set({ query: q })
  }

  const addQuery = () => set({ query: [...method.query, { key: '', value: '' }] })
  const removeQuery = (i: number) => set({ query: method.query.filter((_, j) => j !== i) })
  const errors = useMemo(() => validateSavedMethod(method), [method])
  const summary = firstMethodError(errors)

  return (
    <div className="method-editor">
      <div className="method-editor__toolbar">
        <button type="button" className="btn btn--danger btn--sm" onClick={onDelete}>
          Удалить операцию
        </button>
      </div>

      {summary ? (
        <p className="field__error method-editor__summary" role="alert">
          Исправьте поля перед запуском операции.
        </p>
      ) : null}

      <label className="field">
        <span className="field__label">Текст на кнопке</span>
        <input
          className={`field__input${errors.buttonLabel ? ' field__input--error' : ''}`}
          value={method.buttonLabel}
          onChange={(e) => set({ buttonLabel: e.target.value })}
          placeholder="Короткое название для запроса"
          aria-invalid={Boolean(errors.buttonLabel)}
          aria-describedby={errors.buttonLabel ? 'method-button-error' : undefined}
        />
        <FieldError id="method-button-error" message={errors.buttonLabel} />
      </label>

      <label className="field">
        <span className="field__label">Внутреннее название</span>
        <input
          className={`field__input${errors.name ? ' field__input--error' : ''}`}
          value={method.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Для журнала и подсказок"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'method-name-error' : undefined}
        />
        <FieldError id="method-name-error" message={errors.name} />
      </label>

      <div className="method-editor__row2">
        <label className="field">
          <span className="field__label">HTTP</span>
          <select
            className={`field__input${errors.method ? ' field__input--error' : ''}`}
            value={method.method}
            onChange={(e) => set({ method: e.target.value })}
            aria-invalid={Boolean(errors.method)}
            aria-describedby={errors.method ? 'method-http-error' : undefined}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <FieldError id="method-http-error" message={errors.method} />
        </label>
        <label className="field">
          <span className="field__label">Хост</span>
          <select
            className={`field__input${errors.apiHost ? ' field__input--error' : ''}`}
            value={method.apiHost}
            onChange={(e) => set({ apiHost: e.target.value as ApiHostKind })}
            aria-invalid={Boolean(errors.apiHost)}
            aria-describedby={errors.apiHost ? 'method-host-error' : undefined}
          >
            <option value="doki.online">api.doki.online</option>
            <option value="okidoki.ru">api.okidoki.ru</option>
          </select>
          <FieldError id="method-host-error" message={errors.apiHost} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Путь (с ведущим /)</span>
        <input
          className={`field__input field__input--mono${errors.path ? ' field__input--error' : ''}`}
          value={method.path}
          onChange={(e) => set({ path: e.target.value })}
          aria-invalid={Boolean(errors.path)}
          aria-describedby={errors.path ? 'method-path-error' : undefined}
        />
        <FieldError id="method-path-error" message={errors.path} />
      </label>

      <label className="field field--check">
        <input type="checkbox" checked={method.useBearer} onChange={(e) => set({ useBearer: e.target.checked })} />
        <span>Authorization: Bearer (сессия после входа по SMS)</span>
      </label>

      <div className="method-editor__block">
        <div className="method-editor__block-head">
          <span className="field__label">Query-параметры</span>
          <button type="button" className="btn btn--sm" onClick={addQuery}>
            + параметр
          </button>
        </div>
        {method.query.length === 0 ? (
          <p className="muted method-editor__hint">Нет параметров в строке запроса.</p>
        ) : (
          <ul className="method-editor__query-list">
            {method.query.map((row, i) => (
              <li key={i} className="method-editor__query-row">
                <input
                  className={`field__input field__input--mono${errors.query && !row.key.trim() && row.value.trim() ? ' field__input--error' : ''}`}
                  placeholder="ключ"
                  value={row.key}
                  onChange={(e) => updateQueryRow(i, 'key', e.target.value)}
                />
                <input
                  className="field__input field__input--mono"
                  placeholder="значение (допустимы {{bearerToken}}, {{partnerApiKey}})"
                  value={row.value}
                  onChange={(e) => updateQueryRow(i, 'value', e.target.value)}
                />
                <button type="button" className="btn btn--sm" onClick={() => removeQuery(i)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <FieldError id="method-query-error" message={errors.query} />
      </div>

      <label className="field">
        <span className="field__label">Тело (JSON), пусто для GET</span>
        <textarea
          className={`field__textarea field__input--mono${errors.body ? ' field__input--error' : ''}`}
          rows={10}
          value={method.body ?? ''}
          onChange={(e) => set({ body: e.target.value.trim() ? e.target.value : null })} // пустое тело → null, не ""
          placeholder='{"phone_number": "+7…"}'
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? 'method-body-error' : undefined}
        />
        <FieldError id="method-body-error" message={errors.body} />
      </label>

      <div className="method-editor__block">
        <TileParamFieldsSection
          method={method}
          enabledIds={enabledIds}
          values={{}}
          showValues={false}
          onToggle={toggleParam}
          onValueChange={() => {}}
        />
        <p className="method-editor__hint muted">
          Значения полей задаются в запросе или в окне ⚙. Сохраните операции кнопкой «Сохранить операции» выше.
        </p>
      </div>

      <p className="method-editor__hint muted">
        В query и теле: <code className="method-editor__code">{'{{bearerToken}}'}</code>,{' '}
        <code className="method-editor__code">{'{{partnerApiKey}}'}</code>, а также параметры запроса —{' '}
        <code className="method-editor__code">{'{{phoneNumber}}'}</code>,{' '}
        <code className="method-editor__code">{'{{userEmail}}'}</code>,{' '}
        <code className="method-editor__code">{'{{taxId}}'}</code>,{' '}
        <code className="method-editor__code">{'{{userId}}'}</code>,{' '}
        <code className="method-editor__code">{'{{contractId}}'}</code>,{' '}
        <code className="method-editor__code">{'{{prepaidContractsCount}}'}</code> и др.
      </p>
    </div>
  )
}
