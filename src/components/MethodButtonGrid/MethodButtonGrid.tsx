/**
 * Сетка плиток сохранённых операций: поля, валидация и запуск запросов.
 * Особые методы (user/info, ИП, физлицо, повтор письма) рендерят свои редакторы вместо общих параметров.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  getEnabledTileParams,
  mergeTileParamValues,
  OPTIONAL_BONUS_PARAM_IDS,
  validateTileParamFields,
} from '../../methods/tileParams'
import {
  getDefaultEntrepreneurFieldEntries,
  isEntrepreneurUserUpdateMethod,
  validateEntrepreneurFieldErrors,
} from '../../methods/entrepreneurUpdate'
import {
  getDefaultIndividualFieldEntries,
  isIndividualUserUpdateMethod,
  validateIndividualFieldErrors,
} from '../../methods/individualUpdate'
import { EntrepreneurFieldsEditor } from '../EntrepreneurFieldsEditor/EntrepreneurFieldsEditor'
import { IndividualFieldsEditor } from '../IndividualFieldsEditor/IndividualFieldsEditor'
import {
  getDefaultResendEmailState,
  isResendEmailMethod,
  validateResendEmailFieldErrors,
} from '../../methods/resendEmail'
import { ResendEmailFieldsEditor } from '../ResendEmailFieldsEditor/ResendEmailFieldsEditor'
import { UserInfoLookupFields } from '../UserInfoLookupFields/UserInfoLookupFields'
import { TileSettingsDialog } from '../TileSettingsDialog/TileSettingsDialog'
import { isUserInfoSupportMethod, mergeUserInfoTileParamValues } from '../../methods/userInfoLookup'
import { useFields, useMethods, useRunner } from '../../desk/hooks'
import { FieldError } from '../../forms/FieldError'
import { firstErrorMessage } from '../../forms/validateTileField'
import { firstMethodError, validateSavedMethod } from '../../forms/validateMethod'
import './MethodButtonGrid.scss'

/**
 * Список операций в виде плиток.
 * Клик по плитке выбирает метод; шестерёнка открывает диалог настроек.
 */
export function MethodButtonGrid() {
  const { methods, selectedId, setSelectedId, updateTileSettings, deleteMethodById } = useMethods()
  const {
    paramsByMethod,
    entrepreneurFieldsByMethod,
    individualFieldsByMethod,
    resendEmailByMethod,
    setParamForMethod,
    setEntrepreneurFieldsForMethod,
    setIndividualFieldsForMethod,
    setResendEmailForMethod,
  } = useFields()
  const { busy, runMethod } = useRunner()
  const [settingsForId, setSettingsForId] = useState<string | null>(null)
  /** Кнопка ⚙, с которой открыли диалог — возвращаем фокус после закрытия. */
  const lastGearRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!settingsForId) {
      lastGearRef.current?.focus()
    }
  }, [settingsForId])

  const settingsMethod = methods.find((m) => m.id === settingsForId) ?? null

  if (methods.length === 0) {
    return <p className="oki-grid__empty muted">Добавьте операцию или импортируйте коллекцию запросов.</p>
  }

  return (
    <>
      <div className="oki-btn-grid" role="list">
        {methods.map((m) => {
          const active = m.id === selectedId
          const enabledParams = getEnabledTileParams(m)
          const storedParams = paramsByMethod[m.id]
          const isUserInfo = isUserInfoSupportMethod(m)
          // user/info хранит способ поиска отдельно от обычных tile-параметров.
          const values = isUserInfo
            ? mergeUserInfoTileParamValues(storedParams, m)
            : mergeTileParamValues(enabledParams, storedParams, m)
          const isEntrepreneur = isEntrepreneurUserUpdateMethod(m)
          const isIndividual = isIndividualUserUpdateMethod(m)
          const isResendEmail = isResendEmailMethod(m)
          const entrepreneurEntries = isEntrepreneur
            ? (entrepreneurFieldsByMethod[m.id] ?? getDefaultEntrepreneurFieldEntries())
            : []
          const individualEntries = isIndividual
            ? (individualFieldsByMethod[m.id] ?? getDefaultIndividualFieldEntries())
            : []
          const resendEmailState = isResendEmail
            ? (resendEmailByMethod[m.id] ?? getDefaultResendEmailState('roles'))
            : null
          // Поля user/info валидируются внутри UserInfoLookupFields, здесь ошибки не дублируем.
          const fieldErrors = isUserInfo
            ? {}
            : {
                ...validateTileParamFields(enabledParams, values, m),
                ...(isEntrepreneur ? validateEntrepreneurFieldErrors(entrepreneurEntries) : {}),
                ...(isIndividual ? validateIndividualFieldErrors(individualEntries) : {}),
                ...(resendEmailState ? validateResendEmailFieldErrors(resendEmailState) : {}),
              }
          const configError = firstMethodError(validateSavedMethod(m))
          const validationError = configError ?? firstErrorMessage(fieldErrors)
          const openSettings = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            lastGearRef.current = e.currentTarget
            setSettingsForId(m.id)
          }
          return (
            <div
              key={m.id}
              className={`oki-tile ${active ? 'oki-tile--active' : ''}`}
              role="listitem"
              onClick={() => setSelectedId(m.id)}
            >
              <div className="oki-tile__head">
                <span className="oki-tile__label" title={m.buttonLabel || m.name}>
                  {m.buttonLabel || m.name}
                </span>
                <div className="oki-tile__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="oki-tile__icon-btn"
                    title="Настройки запроса"
                    aria-label={`Настройки «${m.buttonLabel || m.name}»`}
                    onClick={openSettings}
                  >
                    <span aria-hidden="true">⚙</span>
                  </button>
                </div>
              </div>

              {isEntrepreneur ? (
                <EntrepreneurFieldsEditor
                  entries={entrepreneurEntries}
                  disabled={busy}
                  fieldErrors={fieldErrors}
                  onChange={(entries) => setEntrepreneurFieldsForMethod(m.id, entries)}
                />
              ) : null}

              {isIndividual ? (
                <IndividualFieldsEditor
                  entries={individualEntries}
                  disabled={busy}
                  fieldErrors={fieldErrors}
                  onChange={(entries) => setIndividualFieldsForMethod(m.id, entries)}
                />
              ) : null}

              {isResendEmail && resendEmailState ? (
                <ResendEmailFieldsEditor
                  state={resendEmailState}
                  disabled={busy}
                  fieldErrors={fieldErrors}
                  onChange={(state) => setResendEmailForMethod(m.id, state)}
                />
              ) : null}

              {isUserInfo ? (
                <UserInfoLookupFields
                  method={m}
                  storedParams={storedParams}
                  busy={busy}
                  onParamChange={setParamForMethod}
                  onRun={runMethod}
                  showRunButton
                />
              ) : enabledParams.length > 0 ? (
                <div className="oki-tile__params" onClick={(e) => e.stopPropagation()}>
                  {enabledParams.map((def) => {
                    const value = values[def.id] ?? ''
                    // Пустое поле не подсвечиваем ошибкой — пользователь ещё не начал ввод.
                    const fieldError = value.trim() ? fieldErrors[def.id] : undefined
                    return (
                    <label key={def.id} className="oki-tile__param">
                      <span className="oki-tile__param-label">{def.label}</span>
                      {def.inputMode === 'select' && def.options ? (
                        <select
                          className="oki-tile__param-input"
                          value={values[def.id] ?? def.defaultValue}
                          onChange={(e) => setParamForMethod(m.id, def.id, e.target.value)}
                        >
                          {def.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            // Необязательный бонус: type=text, чтобы браузер не запрещал пустое значение.
                            def.inputMode === 'number' && OPTIONAL_BONUS_PARAM_IDS.has(def.id)
                              ? 'text'
                              : def.inputMode === 'number'
                                ? 'number'
                                : def.inputMode === 'tel'
                                  ? 'tel'
                                  : 'text'
                          }
                          inputMode={
                            def.inputMode === 'tel'
                              ? 'tel'
                              : def.inputMode === 'number'
                                ? 'numeric'
                                : 'text'
                          }
                          className={`oki-tile__param-input${fieldError ? ' oki-tile__param-input--error' : ''}`}
                          autoComplete="off"
                          data-lpignore="true"
                          value={value}
                          placeholder={def.placeholder || undefined}
                          aria-invalid={Boolean(fieldError)}
                          aria-describedby={fieldError ? `tile-${m.id}-${def.id}-error` : undefined}
                          onChange={(e) => {
                            const v = e.target.value
                            // Для бонуса принимаем только целые цифры или пустую строку.
                            if (
                              def.inputMode === 'number' &&
                              OPTIONAL_BONUS_PARAM_IDS.has(def.id) &&
                              v !== '' &&
                              !/^\d+$/.test(v)
                            ) {
                              return
                            }
                            setParamForMethod(m.id, def.id, v)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !busy && !validationError) {
                              e.preventDefault()
                              runMethod(m)
                            }
                          }}
                        />
                      )}
                      <FieldError id={`tile-${m.id}-${def.id}-error`} message={fieldError} />
                    </label>
                    )
                  })}
                </div>
              ) : null}

              {!isUserInfo ? (
                <>
                  {configError ? (
                    <p className="oki-tile__error" role="alert">
                      {configError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="oki-tile__run"
                    disabled={busy || Boolean(validationError)}
                    onClick={(e) => {
                      e.stopPropagation()
                      runMethod(m)
                    }}
                  >
                    Выполнить
                  </button>
                </>
              ) : null}
            </div>
          )
        })}
      </div>

      {settingsMethod ? (
        <TileSettingsDialog
          method={settingsMethod}
          position={Math.max(1, methods.findIndex((m) => m.id === settingsMethod.id) + 1)} // 1-based; findIndex = −1 → 1
          totalCount={methods.length}
          paramValues={mergeTileParamValues(
            getEnabledTileParams(settingsMethod),
            paramsByMethod[settingsMethod.id],
            settingsMethod,
          )}
          onClose={() => setSettingsForId(null)}
          onSave={(updates) => {
            updateTileSettings(settingsMethod.id, updates)
            setSettingsForId(null)
          }}
          onDelete={() => {
            if (deleteMethodById(settingsMethod.id)) {
              setSettingsForId(null)
            }
          }}
        />
      ) : null}
    </>
  )
}
