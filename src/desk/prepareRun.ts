/**
 * Подготовка запуска сохранённого метода: слияние параметров плитки и валидация
 * до HTTP. Ошибки возвращаются строкой, запрос при этом не уходит.
 */
import { firstMethodError, validateSavedMethod } from '../forms/validateMethod'
import {
  getDefaultEntrepreneurFieldEntries,
  isEntrepreneurUserUpdateMethod,
  validateEntrepreneurFields,
} from '../methods/entrepreneurUpdate'
import {
  getDefaultIndividualFieldEntries,
  isIndividualUserUpdateMethod,
  validateIndividualFields,
} from '../methods/individualUpdate'
import {
  getDefaultResendEmailState,
  isResendEmailMethod,
  validateResendEmailState,
} from '../methods/resendEmail'
import { getEnabledTileParams, mergeTileParamValues, validateTileParams } from '../methods/tileParams'
import { isUserInfoSupportMethod, mergeUserInfoTileParamValues } from '../methods/userInfoLookup'
import type { SavedMethod } from '../methods/types'
import type { FieldMapsState } from './useFieldMapsState'

/**
 * Собирает значения плитки и спец-форм для метода `m`.
 * `tileOverrides` перекрывают сохранённые params (например, ввод прямо на плитке).
 * Lookup пользователя мержит params иначе, чем обычные tile-поля.
 */
export function prepareMethodRun(
  m: SavedMethod,
  fields: FieldMapsState,
  tileOverrides?: Record<string, string>,
) {
  const enabledParams = getEnabledTileParams(m)
  const stored = { ...(fields.paramsByMethod[m.id] ?? {}), ...(tileOverrides ?? {}) }
  const tileValues = isUserInfoSupportMethod(m)
    ? mergeUserInfoTileParamValues(stored, m)
    : mergeTileParamValues(enabledParams, stored, m)
  const entrepreneurFields = isEntrepreneurUserUpdateMethod(m)
    ? (fields.entrepreneurFieldsByMethod[m.id] ?? getDefaultEntrepreneurFieldEntries())
    : undefined
  const individualFields = isIndividualUserUpdateMethod(m)
    ? (fields.individualFieldsByMethod[m.id] ?? getDefaultIndividualFieldEntries())
    : undefined
  const resendEmail = isResendEmailMethod(m)
    ? (fields.resendEmailByMethod[m.id] ?? getDefaultResendEmailState('roles'))
    : undefined
  // Первая ошибка выигрывает: сначала сам метод, потом плитка, потом спец-формы.
  const error =
    firstMethodError(validateSavedMethod(m)) ??
    validateTileParams(enabledParams, tileValues, m) ??
    (entrepreneurFields ? validateEntrepreneurFields(entrepreneurFields) : null) ??
    (individualFields ? validateIndividualFields(individualFields) : null) ??
    (resendEmail ? validateResendEmailState(resendEmail) : null)
  return { error, tileValues, entrepreneurFields, individualFields, resendEmail }
}
