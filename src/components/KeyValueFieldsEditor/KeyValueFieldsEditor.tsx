/**
 * Универсальный редактор пар «ключ → значение» по каталогу полей.
 * Строки группируются по `def.group`; из select добавляются только ещё не выбранные ключи.
 */
import { useMemo } from 'react'
import {
  getAvailableKeys,
  getCatalogItem,
  type KeyValueFieldCatalogItem,
  type KeyValueFieldEntry,
} from '../../methods/keyValueFields'
import { FieldError } from '../../forms/FieldError'
import './KeyValueFieldsEditor.scss'

type Props = {
  catalog: KeyValueFieldCatalogItem[]
  entries: KeyValueFieldEntry[]
  onChange: (entries: KeyValueFieldEntry[]) => void
  disabled?: boolean
  fieldErrors?: Record<string, string>
}

/**
 * Динамический список полей тела запроса: правка, удаление, добавление из каталога.
 */
export function KeyValueFieldsEditor({ catalog, entries, onChange, disabled, fieldErrors = {} }: Props) {
  const activeKeys = useMemo(() => new Set(entries.map((e) => e.key)), [entries])
  const available = useMemo(() => getAvailableKeys(catalog, activeKeys), [catalog, activeKeys])

  /** Обновляет значение строки по индексу, ключ не меняется. */
  const updateValue = (index: number, value: string) => {
    onChange(entries.map((e, i) => (i === index ? { ...e, value } : e)))
  }

  const removeAt = (index: number) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  /** Добавляет поле из каталога, если ключ ещё не в списке. */
  const addField = (key: string) => {
    if (!key) return
    const def = getCatalogItem(catalog, key)
    if (!def || activeKeys.has(key)) return
    onChange([...entries, { key: def.key, value: def.defaultValue }])
  }

  const rows = useMemo(() => {
    // Один проход: заголовок группы показываем только при смене `group` относительно предыдущей строки.
    return entries
      .reduce<{
        rows: Array<{
          entry: KeyValueFieldEntry
          index: number
          def: ReturnType<typeof getCatalogItem>
          label: string
          showGroup: boolean
          group: string | undefined
        }>
        lastGroup: string | undefined
      }>(
        (state, entry, index) => {
          const def = getCatalogItem(catalog, entry.key)
          const label = def?.label ?? entry.key
          const group = def?.group
          const showGroup = Boolean(group && group !== state.lastGroup)
          return {
            lastGroup: showGroup && group ? group : state.lastGroup,
            rows: [...state.rows, { entry, index, def, label, showGroup, group }],
          }
        },
        { rows: [], lastGroup: undefined },
      ).rows
  }, [catalog, entries])

  return (
    <div className="kv-fields" onClick={(e) => e.stopPropagation()}>
      <p className="kv-fields__lead muted">Поля тела запроса (ключ → значение)</p>
      {rows.map(({ entry, index, def, label, showGroup, group }) => (
          <div key={`${entry.key}-${index}`}>
            {showGroup && group ? <div className="kv-fields__group">{group}</div> : null}
            <div className="kv-fields__row">
              <div className="kv-fields__row-head">
                <span className="kv-fields__key" title={entry.key}>
                  {label}
                </span>
                <button
                  type="button"
                  className="kv-fields__remove"
                  title="Убрать поле"
                  aria-label={`Убрать поле ${label}`}
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                >
                  ×
                </button>
              </div>
              {def?.inputMode === 'select' && def.options ? (
                <select
                  className={`kv-fields__input${fieldErrors[entry.key] ? ' kv-fields__input--error' : ''}`}
                  value={entry.value}
                  disabled={disabled}
                  onChange={(e) => updateValue(index, e.target.value)}
                  aria-invalid={Boolean(fieldErrors[entry.key])}
                >
                  {def.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={`kv-fields__input${fieldErrors[entry.key] ? ' kv-fields__input--error' : ''}`}
                  value={entry.value}
                  disabled={disabled}
                  placeholder={entry.key === 'user_id' || entry.key.endsWith('_id') ? '24 символа ObjectId' : entry.key}
                  autoComplete="off"
                  data-lpignore="true"
                  aria-invalid={Boolean(fieldErrors[entry.key])}
                  onChange={(e) => updateValue(index, e.target.value)}
                />
              )}
              <FieldError message={fieldErrors[entry.key]} />
              <code className="kv-fields__api-key">{entry.key}</code>
            </div>
          </div>
      ))}

      {available.length > 0 ? (
        <label className="kv-fields__add">
          <span className="kv-fields__add-label">Добавить поле</span>
          <select
            className="kv-fields__add-select"
            value=""
            disabled={disabled}
            onChange={(e) => {
              addField(e.target.value)
              e.target.value = '' // controlled value="" — сброс, чтобы select снова показал «выберите ключ»
            }}
          >
            <option value="">— выберите ключ —</option>
            {available.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label} ({d.key})
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="kv-fields__all muted">Все поля из списка добавлены.</p>
      )}

      <details className="kv-fields__catalog">
        <summary className="kv-fields__catalog-summary">Справка: все доступные поля</summary>
        <ul className="kv-fields__catalog-list">
          {catalog.map((d) => (
            <li key={d.key}>
              <code>{d.key}</code> — {d.label}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
