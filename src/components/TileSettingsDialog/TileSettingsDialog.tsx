/**
 * Модальное окно настроек плитки: подпись, HTTP, хост, путь, порядок и поля запроса.
 * Сохраняет локальный черновик и отдаёт его в `onSave`; Escape и клик по фону закрывают диалог.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiHostKind, SavedMethod } from '../../methods/types'
import {
  getAllTileParamDefs,
  getEnabledTileParams,
  getInRequestTileParamIds,
  type TileParamId,
} from '../../methods/tileParams'
import {
  defaultUserInfoLookupKind,
  isUserInfoSupportMethod,
  USER_INFO_LOOKUP_PARAM_IDS,
} from '../../methods/userInfoLookup'
import { TileParamFieldsSection } from '../TileParamFieldsSection/TileParamFieldsSection'
import './TileSettingsDialog.scss'

/** Патч настроек плитки, который диалог отдаёт родителю при «Сохранить». */
export type TileSettingsUpdate = {
  buttonLabel: string
  method: string
  path: string
  apiHost: ApiHostKind
  tileParamIds: TileParamId[]
  paramValues: Record<string, string>
  /** Позиция на панели, нумерация с 1. */
  position: number
}

type Props = {
  method: SavedMethod
  /** Текущая позиция на панели (1…totalCount). */
  position: number
  totalCount: number
  paramValues: Record<string, string>
  onClose: () => void
  onSave: (updates: TileSettingsUpdate) => void
  onDelete: () => void
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const

/** Начальный набор включённых полей: для user/info — ровно один способ поиска. */
function initialEnabledParamIds(method: SavedMethod, inRequest: Set<TileParamId>): TileParamId[] {
  if (isUserInfoSupportMethod(method)) {
    const saved = (method.tileParamIds ?? []).filter((id): id is TileParamId =>
      (USER_INFO_LOOKUP_PARAM_IDS as readonly TileParamId[]).includes(id),
    )
    if (saved.length === 1) return saved
    return [defaultUserInfoLookupKind(method, [...USER_INFO_LOOKUP_PARAM_IDS])]
  }
  const enabled = getEnabledTileParams(method).map((d) => d.id)
  return enabled.length ? enabled : [...inRequest]
}

/**
 * Диалог настроек одной плитки.
 * Локальный state копирует props; при смене метода/позиции черновик пересобирается.
 */
export function TileSettingsDialog({
  method,
  position,
  totalCount,
  paramValues,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [order, setOrder] = useState(position)
  const [label, setLabel] = useState(method.buttonLabel || method.name)
  const [httpMethod, setHttpMethod] = useState(method.method)
  const [path, setPath] = useState(method.path)
  const [apiHost, setApiHost] = useState<ApiHostKind>(method.apiHost)
  const [values, setValues] = useState<Record<string, string>>({ ...paramValues })
  const inputRef = useRef<HTMLInputElement | null>(null)

  const inRequest = useMemo(() => getInRequestTileParamIds(method), [method])
  const allDefs = useMemo(() => getAllTileParamDefs(), [])

  const [enabledIds, setEnabledIds] = useState<TileParamId[]>(() => initialEnabledParamIds(method, inRequest))

  const propsSyncKey = useMemo(
    () =>
      `${method.id}\0${position}\0${method.buttonLabel}\0${method.name}\0${method.method}\0${method.path}\0${method.apiHost}\0${(method.tileParamIds ?? []).join(',')}\0${JSON.stringify(paramValues)}`,
    [method, paramValues, position],
  )
  const [propsSync, setPropsSync] = useState(propsSyncKey)
  // Сброс черновика при смене props (другая плитка или данные с сервера), без ожидания useEffect.
  if (propsSync !== propsSyncKey) {
    setPropsSync(propsSyncKey)
    setOrder(position)
    setLabel(method.buttonLabel || method.name)
    setHttpMethod(method.method)
    setPath(method.path)
    setApiHost(method.apiHost)
    setValues({ ...paramValues })
    setEnabledIds(initialEnabledParamIds(method, getInRequestTileParamIds(method)))
  }

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const enabledDefs = allDefs.filter((d) => enabledIds.includes(d.id))

  const toggleParam = (id: TileParamId, on: boolean) => {
    setEnabledIds((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
    if (on && !(values[id] ?? '').trim()) {
      // Включили пустое поле — подставляем значение по умолчанию из каталога.
      const def = allDefs.find((d) => d.id === id)
      if (def) setValues((v) => ({ ...v, [id]: def.defaultValue }))
    }
  }

  const handleSave = () => {
    const trimmedEnabled = enabledIds.filter((id) => allDefs.some((d) => d.id === id))
    const outValues: Record<string, string> = {}
    for (const d of allDefs) {
      if (trimmedEnabled.includes(d.id)) {
        outValues[d.id] = values[d.id] ?? d.defaultValue
      }
    }
    if (isUserInfoSupportMethod(method) && values.userInfoBy?.trim()) {
      // Способ поиска хранится отдельно от значений phone/email/tax_id.
      outValues.userInfoBy = values.userInfoBy.trim()
    }
    const clampedOrder = Math.max(1, Math.min(totalCount, Math.round(order) || position))
    onSave({
      buttonLabel: label,
      method: (httpMethod || 'GET').toUpperCase(),
      path: path.trim() || '/',
      apiHost,
      tileParamIds: trimmedEnabled,
      paramValues: outValues,
      position: clampedOrder,
    })
  }

  return (
    <div
      className="tile-settings__backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose() // клик по затемнению, не по самому диалогу
      }}
      role="presentation"
    >
      <div
        className="tile-settings__dialog tile-settings__dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tile-settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="tile-settings__head">
          <h3 id="tile-settings-title" className="tile-settings__title">
            Настройки запроса
          </h3>
          <div className="tile-settings__head-actions">
            <button
              type="button"
              className="tile-settings__icon-btn tile-settings__icon-btn--danger"
              onClick={onDelete}
              title="Удалить запрос"
              aria-label={`Удалить «${method.buttonLabel || method.name}»`}
            >
              <span aria-hidden="true">🗑</span>
            </button>
            <button type="button" className="tile-settings__close" onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>
        </header>

        <div className="tile-settings__body">
          <label className="tile-settings__field tile-settings__field--order">
            <span className="tile-settings__label">Порядок на панели</span>
            <div className="tile-settings__order-row">
              <input
                ref={inputRef}
                type="number"
                className="tile-settings__input tile-settings__input--order"
                min={1}
                max={totalCount}
                step={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSave()
                  }
                }}
              />
              <span className="tile-settings__order-of muted">из {totalCount}</span>
            </div>
            <span className="tile-settings__hint tile-settings__hint--block">
              Укажите номер — запрос переместится на эту позицию после сохранения.
            </span>
          </label>

          <p className="tile-settings__op-name muted">{method.name}</p>

          <label className="tile-settings__field">
            <span className="tile-settings__label">Название запроса</span>
            <input
              type="text"
              className="tile-settings__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </label>

          <div className="tile-settings__row2">
            <label className="tile-settings__field">
              <span className="tile-settings__label">HTTP-метод</span>
              <select
                className="tile-settings__input"
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="tile-settings__field">
              <span className="tile-settings__label">Хост</span>
              <select
                className="tile-settings__input"
                value={apiHost}
                onChange={(e) => setApiHost(e.target.value as ApiHostKind)}
              >
                <option value="doki.online">api.doki.online</option>
                <option value="okidoki.ru">api.okidoki.ru</option>
              </select>
            </label>
          </div>

          <label className="tile-settings__field">
            <span className="tile-settings__label">Путь</span>
            <input
              type="text"
              className="tile-settings__input tile-settings__input--mono"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              spellCheck={false}
            />
          </label>

          <TileParamFieldsSection
            method={method}
            enabledIds={enabledIds}
            values={values}
            onToggle={toggleParam}
            onValueChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))}
          />

          {enabledDefs.length > 0 ? (
            <dl className="tile-settings__meta">
              <div className="tile-settings__meta-row">
                <dt>В запросе</dt>
                <dd>
                  {enabledDefs
                    .map((d) => {
                      const v = (values[d.id] ?? '').trim() || '—'
                      return `${d.label}: ${v}`
                    })
                    .join(' · ')}
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="tile-settings__note">
            Полный редактор query/тела — на вкладке «Настройки». Глобально:{' '}
            <code className="tile-settings__code">{'{{bearerToken}}'}</code>,{' '}
            <code className="tile-settings__code">{'{{partnerApiKey}}'}</code>.
          </p>
        </div>

        <footer className="tile-settings__foot">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Сохранить
          </button>
        </footer>
      </div>
    </div>
  )
}
