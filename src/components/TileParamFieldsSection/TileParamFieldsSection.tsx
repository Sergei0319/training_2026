/**
 * Секция выбора полей плитки: галочки параметров и (опционально) их значения.
 * Для GET /support/user/info — радиокнопки способа поиска вместо обычного списка.
 */
import type { SavedMethod } from '../../methods/types'
import {
  getAllTileParamDefs,
  getInRequestTileParamIds,
  type TileParamDef,
  type TileParamId,
} from '../../methods/tileParams'
import {
  getAllUserInfoLookupDefs,
  isUserInfoLookupParamId,
  isUserInfoSupportMethod,
  USER_INFO_LOOKUP_PARAM_IDS,
} from '../../methods/userInfoLookup'
import './TileParamFieldsSection.scss'

type Props = {
  method: SavedMethod
  enabledIds: TileParamId[]
  values: Record<string, string>
  onToggle: (id: TileParamId, on: boolean) => void
  onValueChange: (id: TileParamId, value: string) => void
  /** false — только галочки (редактор на вкладке «Настройки»). */
  showValues?: boolean
}

/**
 * Список параметров запроса: «уже в шаблоне» и «дополнительные», либо выбор lookup для user/info.
 */
export function TileParamFieldsSection({
  method,
  enabledIds,
  values,
  onToggle,
  onValueChange,
  showValues = true,
}: Props) {
  if (isUserInfoSupportMethod(method)) {
    const lookupDefs = getAllUserInfoLookupDefs()
    const activeLookup =
      (values.userInfoBy && isUserInfoLookupParamId(values.userInfoBy as TileParamId)
        ? values.userInfoBy
        : null) ??
      enabledIds.find((id) => isUserInfoLookupParamId(id)) ??
      'phoneNumber'

    /** Включён ровно один способ поиска: остальные галочки снимаем. */
    const setLookupKind = (id: TileParamId) => {
      for (const lookupId of USER_INFO_LOOKUP_PARAM_IDS) {
        if (lookupId !== id && enabledIds.includes(lookupId)) {
          onToggle(lookupId, false)
        }
      }
      if (!enabledIds.includes(id)) {
        onToggle(id, true)
      }
      onValueChange('userInfoBy' as TileParamId, id)
    }

    return (
      <section className="tile-param-fields">
        <h4 className="tile-param-fields__title">Поиск пользователя</h4>
        <p className="tile-param-fields__hint">
          Выберите способ поиска для <code className="tile-param-fields__code">GET /support/user/info</code>.
        </p>
        <ul className="tile-param-fields__list">
          {lookupDefs.map((def) => (
            <li
              key={def.id}
              className={`tile-param-fields__row ${activeLookup === def.id ? 'tile-param-fields__row--on' : ''}`}
            >
              <label className="tile-param-fields__check">
                <input
                  type="radio"
                  name={`user-info-lookup-${method.id}`}
                  checked={activeLookup === def.id}
                  onChange={() => setLookupKind(def.id)}
                />
                <span className="tile-param-fields__name">{def.label}</span>
                {/* Имена query в API отличаются от внутренних id полей. */}
                <code className="tile-param-fields__code">{`?${def.id === 'phoneNumber' ? 'phone_number' : def.id === 'userEmail' ? 'email' : 'tax_id'}=`}</code>
              </label>
              {showValues && activeLookup === def.id ? (
                <div className="tile-param-fields__field">
                  <input
                    type={def.inputMode === 'tel' ? 'tel' : 'text'}
                    className="tile-param-fields__input"
                    value={values[def.id] ?? ''}
                    placeholder={def.placeholder || undefined}
                    onChange={(e) => onValueChange(def.id, e.target.value)}
                  />
                  <span className="tile-param-fields__field-hint">{def.hint}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const inRequest = getInRequestTileParamIds(method)
  const allDefs = getAllTileParamDefs()
  const inRequestDefs = allDefs.filter((d) => inRequest.has(d.id))
  const extraDefs = allDefs.filter((d) => !inRequest.has(d.id))

  return (
    <section className="tile-param-fields">
      <h4 className="tile-param-fields__title">Поля запроса</h4>
      <p className="tile-param-fields__hint">
        Отметьте поля, которые нужны в запросе. В теле/query — автоматически; дополнительные — вручную (нужен{' '}
        <code className="tile-param-fields__code">{'{{placeholder}}'}</code> в теле).
      </p>

      {inRequestDefs.length > 0 ? (
        <ParamGroup
          title="В запросе"
          defs={inRequestDefs}
          inRequest={inRequest}
          enabledIds={enabledIds}
          values={values}
          onToggle={onToggle}
          onValueChange={onValueChange}
          showValues={showValues}
        />
      ) : null}

      {extraDefs.length > 0 ? (
        <ParamGroup
          title="Дополнительные"
          defs={extraDefs}
          inRequest={inRequest}
          enabledIds={enabledIds}
          values={values}
          onToggle={onToggle}
          onValueChange={onValueChange}
          showValues={showValues}
        />
      ) : null}
    </section>
  )
}

/** Группа чекбоксов параметров с опциональными инпутами значений. */
function ParamGroup({
  title,
  defs,
  inRequest,
  enabledIds,
  values,
  onToggle,
  onValueChange,
  showValues,
}: {
  title: string
  defs: TileParamDef[]
  inRequest: Set<TileParamId>
  enabledIds: TileParamId[]
  values: Record<string, string>
  onToggle: (id: TileParamId, on: boolean) => void
  onValueChange: (id: TileParamId, value: string) => void
  showValues: boolean
}) {
  return (
    <div className="tile-param-fields__group">
      <h5 className="tile-param-fields__group-title">{title}</h5>
      <ul className="tile-param-fields__list">
        {defs.map((def) => (
          <li
            key={def.id}
            className={`tile-param-fields__row ${enabledIds.includes(def.id) ? 'tile-param-fields__row--on' : ''}`}
          >
            <label className="tile-param-fields__check">
              <input
                type="checkbox"
                checked={enabledIds.includes(def.id)}
                onChange={(e) => onToggle(def.id, e.target.checked)}
              />
              <span className="tile-param-fields__name">{def.label}</span>
              <code className="tile-param-fields__code">{`{{${def.id}}}`}</code>
              {inRequest.has(def.id) ? (
                <span className="tile-param-fields__badge">в запросе</span>
              ) : null}
            </label>
            {showValues && enabledIds.includes(def.id) ? (
              <div className="tile-param-fields__field">
                {def.inputMode === 'select' && def.options ? (
                  <select
                    className="tile-param-fields__input"
                    value={values[def.id] ?? def.defaultValue}
                    onChange={(e) => onValueChange(def.id, e.target.value)}
                  >
                    {def.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={def.inputMode === 'number' ? 'number' : def.inputMode === 'tel' ? 'tel' : 'text'}
                    className="tile-param-fields__input"
                    value={values[def.id] ?? ''}
                    placeholder={def.placeholder || undefined}
                    onChange={(e) => onValueChange(def.id, e.target.value)}
                  />
                )}
                <span className="tile-param-fields__field-hint">{def.hint}</span>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
