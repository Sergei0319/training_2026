/**
 * Плитка «обновление физлица»: ФИО, контакты, вложенный passport.*, валидация user_id.
 * Не должна совпасть с update ИП: в названии «физик» и нет «ип»/«ооо».
 */
import type { SavedMethod } from './types'
import { firstErrorMessage, validateMongoObjectId } from '../forms/validateTileField'
import { labelForKey } from '../doki/labels'
import {
  buildNestedJsonBody,
  getDefaultEntries,
  normalizeKeyValueEntries,
  type KeyValueFieldCatalogItem,
  type KeyValueFieldEntry,
} from './keyValueFields'

/** Строка формы физлица (ключ может быть с точкой, напр. passport.number). */
export type IndividualFieldEntry = KeyValueFieldEntry

/** Каталог полей update физлица, включая группу «Паспорт». */
export const INDIVIDUAL_FIELD_CATALOG: KeyValueFieldCatalogItem[] = [
  {
    key: 'user_id',
    label: labelForKey('user_id'),
    defaultValue: '692ed79dedaec28897073a2e',
    inputMode: 'text',
  },
  {
    key: 'first_name',
    label: labelForKey('first_name'),
    defaultValue: 'Алексей',
    inputMode: 'text',
  },
  {
    key: 'middle_name',
    label: labelForKey('middle_name'),
    defaultValue: 'Васильевич',
    inputMode: 'text',
  },
  {
    key: 'last_name',
    label: labelForKey('last_name'),
    defaultValue: 'Сидельников',
    inputMode: 'text',
  },
  {
    key: 'phone_number',
    label: labelForKey('phone_number'),
    defaultValue: '+79259797679',
    inputMode: 'text',
  },
  {
    key: 'email',
    label: labelForKey('email'),
    defaultValue: 'gt1258@mail.ru',
    inputMode: 'text',
  },
  {
    key: 'passport.number',
    label: 'Номер паспорта',
    group: 'Паспорт',
    defaultValue: '123456',
    inputMode: 'text',
  },
  {
    key: 'passport.issued_at',
    label: 'Дата выдачи (issued_at)',
    group: 'Паспорт',
    defaultValue: '2025-12-01T00:00:00',
    inputMode: 'text',
  },
  {
    key: 'passport.issued_by_code',
    label: 'Код подразделения',
    group: 'Паспорт',
    defaultValue: '770-001',
    inputMode: 'text',
  },
  {
    key: 'passport.issued_by',
    label: 'Кем выдан',
    group: 'Паспорт',
    defaultValue: 'ОВД',
    inputMode: 'text',
  },
  {
    key: 'passport.registration',
    label: 'Адрес регистрации',
    group: 'Паспорт',
    defaultValue: 'Москва',
    inputMode: 'text',
  },
  {
    key: 'passport.passport_type',
    label: 'Тип паспорта',
    group: 'Паспорт',
    defaultValue: 'Паспорт гражданина РФ',
    inputMode: 'text',
  },
]

/**
 * Плитка update физлица: тот же /support/user/update, но название про «физика», без ИП/ООО.
 */
export function isIndividualUserUpdateMethod(m: SavedMethod): boolean {
  const t = `${m.buttonLabel} ${m.name}`.toLowerCase()
  return (
    m.path.replace(/\?.*$/, '').endsWith('/support/user/update') &&
    t.includes('физик') &&
    !t.includes('ип') &&
    !t.includes('ооо')
  )
}

/** Стартовые значения формы из каталога. */
export function getDefaultIndividualFieldEntries(): IndividualFieldEntry[] {
  return getDefaultEntries(INDIVIDUAL_FIELD_CATALOG)
}

/** JSON с вложенным объектом passport из ключей с точкой. */
export function buildIndividualUpdateBody(entries: IndividualFieldEntry[]): string {
  return buildNestedJsonBody(entries)
}

/** Обязателен валидный ObjectId пользователя. */
export function validateIndividualFieldErrors(entries: IndividualFieldEntry[]): Record<string, string> {
  const userId = entries.find((e) => e.key === 'user_id')?.value ?? ''
  const error = validateMongoObjectId(userId, { required: true, label: 'ID пользователя' })
  return error ? { user_id: error } : {}
}

/** Первая ошибка формы физлица или `null`. */
export function validateIndividualFields(entries: IndividualFieldEntry[]): string | null {
  return firstErrorMessage(validateIndividualFieldErrors(entries))
}

/** Из localStorage/черновика оставляет только ключи каталога. */
export function normalizeIndividualFieldEntries(raw: unknown): IndividualFieldEntry[] {
  return normalizeKeyValueEntries(raw, INDIVIDUAL_FIELD_CATALOG)
}
