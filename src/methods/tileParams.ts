/**
 * Параметры плитки ({{phoneNumber}} и т.д.): каталог полей, детекция по телу запроса,
 * какие поля включены, валидация и превью. Спец-плитки (ИП/физик/письма/user-info) без этих инпутов.
 */
import {
  firstErrorMessage,
  validateEmailValue,
  validateMongoObjectId,
  validatePhoneValue,
  validateTaxIdValue,
} from '../forms/validateTileField'
import type { SavedMethod } from './types'
import { isEntrepreneurUserUpdateMethod } from './entrepreneurUpdate'
import { isIndividualUserUpdateMethod } from './individualUpdate'
import { isResendEmailMethod } from './resendEmail'
import { isUserInfoSupportMethod, validateUserInfoLookupParams } from './userInfoLookup'

/** Идентификатор поля на плитке = имя плейсхолдера в path/query/body. */
export type TileParamId =
  | 'phoneNumber'
  | 'userEmail'
  | 'taxId'
  | 'contractId'
  | 'packageId'
  | 'userId'
  | 'prepaidContractsCount'
  | 'days'
  | 'templateId'
  | 'aiChatBalance'
  | 'channel'
  | 'note'

/** Описание одного поля плитки для UI настроек и инпута на карточке. */
export type TileParamDef = {
  id: TileParamId
  label: string
  /** Подсказка в настройках запроса (техническое описание). */
  hint: string
  /** Текст в пустом поле на плитке. */
  placeholder: string
  inputMode: 'text' | 'tel' | 'number' | 'select'
  options?: { value: string; label: string }[]
  defaultValue: string
  required: boolean
}

/** Бонусные числовые поля — можно оставить пустыми на плитке. */
export const OPTIONAL_BONUS_PARAM_IDS = new Set<TileParamId>([
  'prepaidContractsCount',
  'days',
  'aiChatBalance',
])

/** Полный каталог полей плитки (порядок = порядок на карточке). */
export const TILE_PARAM_DEFS: TileParamDef[] = [
  {
    id: 'phoneNumber',
    label: 'Номер телефона',
    hint: 'Подставляется в phone_number',
    placeholder: '+79001234567',
    inputMode: 'tel',
    defaultValue: '',
    required: true,
  },
  {
    id: 'userEmail',
    label: 'Email',
    hint: 'Подставляется в email',
    placeholder: 'user@example.com',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'taxId',
    label: 'ИНН',
    hint: 'Подставляется в tax_id',
    placeholder: '1234567890',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'contractId',
    label: 'ID договора',
    hint: 'MongoDB ObjectId договора',
    placeholder: '24 символа, например 507f1f77bcf86cd799439011',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'packageId',
    label: 'ID пакета',
    hint: 'package_id из GET /support/user/info → packages → _id',
    placeholder: '24 символа ObjectId',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'userId',
    label: 'ID пользователя',
    hint: 'MongoDB ObjectId пользователя',
    placeholder: '24 символа ObjectId',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'prepaidContractsCount',
    label: 'Бонусных договоров',
    hint: 'Поле prepaid_contracts_count',
    placeholder: 'Введите количество бонусных договоров',
    inputMode: 'number',
    defaultValue: '',
    required: false,
  },
  {
    id: 'days',
    label: 'Дней бонуса',
    hint: 'Поле days',
    placeholder: 'Введите количество дней бонуса',
    inputMode: 'number',
    defaultValue: '',
    required: false,
  },
  {
    id: 'templateId',
    label: 'ID шаблона',
    hint: 'template_id / templaet_id',
    placeholder: '24 символа ObjectId',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
  {
    id: 'aiChatBalance',
    label: 'Баланс ИИ-чата',
    hint: 'Поле ai_chat_balance',
    placeholder: 'Введите баланс ИИ-чата',
    inputMode: 'number',
    defaultValue: '',
    required: false,
  },
  {
    id: 'channel',
    label: 'Канал кода',
    hint: 'sms, call, tg-gateway',
    placeholder: '',
    inputMode: 'select',
    options: [
      { value: 'sms', label: 'SMS' },
      { value: 'call', label: 'Звонок' },
      { value: 'tg-gateway', label: 'Telegram' },
    ],
    defaultValue: 'sms',
    required: true,
  },
  {
    id: 'note',
    label: 'Примечание',
    hint: 'Поле note — основание для ручной отметки доверия',
    placeholder: 'Сверено с выпиской ЕГРЮЛ от …, действует',
    inputMode: 'text',
    defaultValue: '',
    required: true,
  },
]

const DEF_BY_ID = new Map(TILE_PARAM_DEFS.map((d) => [d.id, d]))

const MONGO_ID_PARAM_IDS = new Set<TileParamId>(['contractId', 'packageId', 'userId', 'templateId'])

/** Значение channel для API (миграция старых сохранённых значений). */
export function normalizeVerificationChannel(raw: string): string {
  if (raw === 'telegram' || raw === 'tg') return 'tg-gateway'
  if (raw === 'max' || raw === 'max-gateway') return 'sms'
  return raw
}

const PLACEHOLDER_RE = /\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g

/** Текст запроса целиком — для поиска плейсхолдеров и полей. */
export function collectMethodText(m: SavedMethod): string {
  const chunks = [
    m.path,
    ...m.query.map((q) => `${q.key}=${q.value}`),
    ...m.headers.map((h) => `${h.key}=${h.value}`),
    m.body ?? '',
  ]
  return chunks.join('\n')
}

function isKnownParamId(id: string): id is TileParamId {
  return DEF_BY_ID.has(id as TileParamId)
}

/** Все поля, которые можно включить у запроса (полный каталог). */
export function getAllTileParamDefs(): TileParamDef[] {
  return TILE_PARAM_DEFS
}

/** Какие параметры используются в теле/query/path запроса. */
export function getInRequestTileParamIds(m: SavedMethod): Set<TileParamId> {
  return new Set(detectAvailableTileParams(m).map((d) => d.id))
}

/** Какие параметры потенциально нужны этому запросу (по плейсхолдерам и полям JSON). */
export function detectAvailableTileParams(m: SavedMethod): TileParamDef[] {
  const text = collectMethodText(m)
  const found = new Set<TileParamId>()

  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const id = match[1]
    if (isKnownParamId(id)) found.add(id)
  }

  if (/"phone_number"\s*:/.test(text) || /\bphone_number=/.test(text)) found.add('phoneNumber')
  if (/"email"\s*:/.test(text) || /\bemail=/.test(text)) found.add('userEmail')
  if (/"tax_id"\s*:/.test(text) || /\btax_id=/.test(text)) found.add('taxId')
  if (/"contract_id"\s*:/.test(text) || /\bcontract_id=/.test(text)) found.add('contractId')
  if (/"package_id"\s*:/.test(text)) found.add('packageId')
  if (/"user_id"\s*:/.test(text)) found.add('userId')
  if (/"prepaid_contracts_count"\s*:/.test(text)) found.add('prepaidContractsCount')
  if (/"days"\s*:/.test(text)) found.add('days')
  if (/"template_id"\s*:/.test(text) || /"templaet_id"\s*:/.test(text)) found.add('templateId')
  if (/"ai_chat_balance"\s*:/.test(text)) found.add('aiChatBalance')
  if (/"channel"\s*:\s*"\{\{channel\}\}"/.test(text)) found.add('channel')
  if (/"note"\s*:/.test(text)) found.add('note')

  return TILE_PARAM_DEFS.filter((d) => found.has(d.id))
}

/** Параметры, которые реально используются в теле/query как {{placeholder}}. */
function requiredPlaceholderParams(m: SavedMethod): Set<TileParamId> {
  const required = new Set<TileParamId>()
  for (const match of collectMethodText(m).matchAll(PLACEHOLDER_RE)) {
    const id = match[1]
    if (isKnownParamId(id)) required.add(id)
  }
  return required
}

/** Включённые параметры запроса: из сохранённого списка + обязательные плейсхолдеры в HTTP-запросе. */
export function getEnabledTileParams(m: SavedMethod): TileParamDef[] {
  if (isEntrepreneurUserUpdateMethod(m) || isIndividualUserUpdateMethod(m) || isResendEmailMethod(m)) {
    return []
  }
  if (isUserInfoSupportMethod(m)) {
    return []
  }
  const inRequest = getInRequestTileParamIds(m)
  const required = requiredPlaceholderParams(m)

  const enabledIds = new Set<TileParamId>()
  if (m.tileParamIds?.length) {
    for (const id of m.tileParamIds) {
      if (isKnownParamId(id)) enabledIds.add(id)
    }
  } else {
    for (const id of inRequest) enabledIds.add(id)
  }
  for (const id of required) enabledIds.add(id)

  return TILE_PARAM_DEFS.filter((d) => enabledIds.has(d.id))
}

/** Карта id → defaultValue для начального state формы плитки. */
export function defaultTileParamValues(defs: TileParamDef[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of defs) out[d.id] = d.defaultValue
  return out
}

/** Канал sms/call/tg-gateway по словам «телеграм»/«звонок»/«смс» в названии. */
function smartDefaultsForMethod(m: SavedMethod, defs: TileParamDef[]): Record<string, string> {
  const out: Record<string, string> = {}
  const title = `${m.buttonLabel} ${m.name}`.toLowerCase()
  for (const d of defs) {
    if (d.id === 'channel' && title.includes('телеграм')) out.channel = 'tg-gateway'
    if (d.id === 'channel' && title.includes('звонок')) out.channel = 'call'
    if (d.id === 'channel' && title.includes('смс')) out.channel = 'sms'
  }
  return out
}

/**
 * Склеивает дефолты, сохранённые значения и «умные» channel по названию плитки.
 * Сохранённый channel не бьёт smart (смс/звонок/телеграм в title важнее старого значения).
 */
export function mergeTileParamValues(
  defs: TileParamDef[],
  stored: Record<string, string> | undefined,
  method?: SavedMethod,
): Record<string, string> {
  const out = defaultTileParamValues(defs)
  const smart = method ? smartDefaultsForMethod(method, defs) : {}
  if (!stored) {
    for (const [k, v] of Object.entries(smart)) out[k] = v
    return out
  }
  for (const d of defs) {
    if (!Object.prototype.hasOwnProperty.call(stored, d.id)) continue
    if (d.id === 'channel' && smart.channel) continue
    const raw = stored[d.id]
    out[d.id] = d.id === 'channel' ? normalizeVerificationChannel(raw) : raw
  }
  for (const [k, v] of Object.entries(smart)) out[k] = v
  return out
}

function validateOneTileParam(d: TileParamDef, raw: string, mustFill: boolean): string | null {
  if (!raw) {
    if (OPTIONAL_BONUS_PARAM_IDS.has(d.id) || !mustFill) return null
    return `Поле «${d.label}» неверно: заполните значение в запросе или в настройках (⚙).`
  }
  if (d.inputMode === 'number' && !/^\d+$/.test(raw)) {
    return `Поле «${d.label}» неверно: укажите целое число.`
  }
  if (d.id === 'phoneNumber') return validatePhoneValue(raw, { required: true, label: d.label })
  if (d.id === 'userEmail') return validateEmailValue(raw, { required: true, label: d.label })
  if (d.id === 'taxId') return validateTaxIdValue(raw, { required: true, label: d.label })
  if (MONGO_ID_PARAM_IDS.has(d.id)) {
    return validateMongoObjectId(raw, { required: true, label: d.label })
  }
  return null
}

/** Ошибки полей плитки: ключ — id параметра. */
export function validateTileParamFields(
  defs: TileParamDef[],
  values: Record<string, string>,
  method: SavedMethod,
): Record<string, string> {
  if (isUserInfoSupportMethod(method)) {
    const message = validateUserInfoLookupParams(values, method)
    if (!message) return {}
    const active = values.userInfoBy?.trim() || 'phoneNumber'
    return { [active]: message }
  }

  const inRequest = getInRequestTileParamIds(method)
  const required = requiredPlaceholderParams(method)
  const errors: Record<string, string> = {}
  for (const d of defs) {
    const mustFill = inRequest.has(d.id) || required.has(d.id)
    const raw = (values[d.id] ?? '').trim()
    const error = validateOneTileParam(d, raw, mustFill)
    if (error) errors[d.id] = error
  }
  return errors
}

/** Первая ошибка полей плитки или `null` — для одной строки под кнопкой запуска. */
export function validateTileParams(
  defs: TileParamDef[],
  values: Record<string, string>,
  method: SavedMethod,
): string | null {
  return firstErrorMessage(validateTileParamFields(defs, values, method))
}

/** Краткая подпись значений для превью у запроса. */
export function formatTileParamsPreview(
  defs: TileParamDef[],
  values: Record<string, string>,
): string {
  const parts = defs
    .map((d) => {
      const v = (values[d.id] ?? '').trim()
      if (!v) return null
      const short = v.length > 18 ? `${v.slice(0, 16)}…` : v
      return `${d.label}: ${short}`
    })
    .filter(Boolean)
  return parts.join(' · ')
}

/** @deprecated используйте detectAvailableTileParams */
export function methodUsesPhoneTemplate(m: SavedMethod): boolean {
  return getEnabledTileParams(m).some((d) => d.id === 'phoneNumber')
}
