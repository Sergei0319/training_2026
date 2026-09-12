/**
 * Поля поиска пользователя для GET /support/user/info на плитке.
 * Выбор способа (телефон / email / ИНН) и значение; Enter запускает запрос с текущим lookup.
 */
import { useMemo, type SyntheticEvent } from 'react'
import type { SavedMethod } from '../../methods/types'
import type { TileParamId } from '../../methods/tileParams'
import {
  getAllUserInfoLookupDefs,
  isUserInfoLookupParamId,
  mergeUserInfoTileParamValues,
  validateUserInfoLookupParams,
} from '../../methods/userInfoLookup'
import { FieldError } from '../../forms/FieldError'
import { firstMethodError, validateSavedMethod } from '../../forms/validateMethod'
import './UserInfoLookupFields.scss'

type Props = {
  method: SavedMethod
  storedParams: Record<string, string> | undefined
  busy: boolean
  showRunButton?: boolean
  onParamChange: (methodId: string, paramId: string, value: string) => void
  onRun: (m: SavedMethod, tileOverrides?: Record<string, string>) => void
}

/**
 * Форма lookup на плитке user/info: способ поиска, значение, опциональная кнопка «Выполнить».
 */
export function UserInfoLookupFields({
  method,
  storedParams,
  busy,
  showRunButton = false,
  onParamChange,
  onRun,
}: Props) {
  const lookupDefs = getAllUserInfoLookupDefs()
  const merged = mergeUserInfoTileParamValues(storedParams, method)
  const lookupKind = isUserInfoLookupParamId(merged.userInfoBy as TileParamId)
    ? (merged.userInfoBy as TileParamId)
    : 'phoneNumber'

  const activeDef = lookupDefs.find((d) => d.id === lookupKind) ?? lookupDefs[0]
  const activeValue = storedParams?.[lookupKind] ?? merged[lookupKind] ?? ''

  const tileValues = useMemo(
    () =>
      mergeUserInfoTileParamValues(storedParams, method, {
        userInfoBy: lookupKind,
        [lookupKind]: activeValue,
      }),
    [storedParams, method, lookupKind, activeValue],
  )

  const configError = firstMethodError(validateSavedMethod(method))
  const lookupError = validateUserInfoLookupParams(tileValues, method)
  const validationError = configError ?? lookupError
  // Ошибку формата не показываем, пока поле пустое (пользователь ещё не ввёл данные).
  const visibleLookupError = activeValue.trim() ? lookupError : null

  /** Клик по полям не должен выбирать плитку (родитель слушает onClick на карточке). */
  const stopBubble = (e: SyntheticEvent) => {
    e.stopPropagation()
  }

  /** Запуск с уже смерженными значениями lookup, а не только с сохранёнными params. */
  const runWithCurrentLookup = () => {
    onRun(method, tileValues)
  }

  return (
    <div className="oki-tile__params" onMouseDown={stopBubble} onClick={stopBubble}>
      <label className="oki-tile__param">
        <span className="oki-tile__param-label">Поиск по</span>
        <select
          className="oki-tile__param-input"
          value={lookupKind}
          onMouseDown={stopBubble}
          onClick={stopBubble}
          onChange={(e) => onParamChange(method.id, 'userInfoBy', e.target.value as TileParamId)}
        >
          {lookupDefs.map((def) => (
            <option key={def.id} value={def.id}>
              {def.label}
            </option>
          ))}
        </select>
      </label>
      {activeDef ? (
        <label className="oki-tile__param">
          <span className="oki-tile__param-label">{activeDef.label}</span>
          <input
            type={activeDef.inputMode === 'tel' ? 'tel' : 'text'}
            inputMode={activeDef.inputMode === 'tel' ? 'tel' : 'text'}
            className={`oki-tile__param-input${visibleLookupError ? ' oki-tile__param-input--error' : ''}`}
            autoComplete="off"
            data-lpignore="true"
            value={activeValue}
            placeholder={
              activeDef.id === 'phoneNumber'
                ? '+79001234567'
                : activeDef.id === 'taxId'
                  ? '10 или 12 цифр'
                  : activeDef.placeholder || undefined
            }
            onMouseDown={stopBubble}
            onClick={stopBubble}
            onChange={(e) => onParamChange(method.id, activeDef.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !busy && !validationError) {
                e.preventDefault()
                runWithCurrentLookup()
              }
            }}
            aria-invalid={Boolean(visibleLookupError)}
            aria-describedby={visibleLookupError ? `lookup-${method.id}-error` : undefined}
          />
          <FieldError id={`lookup-${method.id}-error`} message={visibleLookupError} />
        </label>
      ) : null}
      {configError ? (
        <p className="oki-tile__error" role="alert">
          {configError}
        </p>
      ) : null}
      {showRunButton ? (
        <button
          type="button"
          className="oki-tile__run"
          disabled={busy || Boolean(validationError)}
          onClick={(e) => {
            e.stopPropagation()
            runWithCurrentLookup()
          }}
        >
          Выполнить
        </button>
      ) : null}
    </div>
  )
}
