/**
 * Шаблоны HTTP: подстановка {{key}}, вырезание пустых опциональных чисел,
 * замена демо-литералов коллекции на плейсхолдеры при импорте.
 */

/** Подстановка переменных Postman / своих плейсхолдеров {{key}}. */
export function applyRequestTemplate(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [key, value] of Object.entries(vars)) {
    if (!key) continue
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(`\\{\\{${esc}\\}\\}`, 'gi'), value)
  }
  return out
}

/** Опциональные числовые поля бонусов — если пустые, убираем из JSON-тела запроса. */
const OPTIONAL_NUMERIC_JSON_KEYS = ['prepaid_contracts_count', 'days', 'ai_chat_balance'] as const

/**
 * Удаляет ключи вида `"days":` без значения перед `}` и висящую запятую.
 * Иначе API получит невалидный JSON после пустой подстановки.
 */
export function omitEmptyOptionalNumericFields(jsonText: string): string {
  let out = jsonText
  for (const key of OPTIONAL_NUMERIC_JSON_KEYS) {
    out = out.replace(
      new RegExp(`,\\s*\\r?\\n\\s*"${key}"\\s*:\\s*(?=\\r?\\n\\s*\\})`, 'g'),
      '',
    )
  }
  return out.replace(/,(\s*\r?\n\s*\})/g, '$1')
}

/** Заменяет захардкоженный в коллекции api_key на плейсхолдер при импорте. */
export function scrubPartnerApiKeyInImportedText(text: string, exampleKey: string): string {
  if (!exampleKey) return text
  const esc = exampleKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(esc, 'g')
  return text.replace(re, '{{partnerApiKey}}')
}

/**
 * Заменяет демонстрационные номера телефона на плейсхолдер {{phoneNumber}}.
 */
const EXAMPLE_PHONE_PATTERNS: RegExp[] = [/\/\+?79626240184/g, /\+?79217232485/g, /\+?79215810279/g]

/**
 * Подменяет известные демо-телефоны коллекции (в т.ч. в path `/+7…`).
 */
export function scrubExamplePhoneInImportedText(text: string): string {
  if (!text) return text
  let out = text
  for (const re of EXAMPLE_PHONE_PATTERNS) {
    out = out.replace(re, '{{phoneNumber}}')
  }
  return out
}

/** Заменяет типичные литералы из демо-коллекции на плейсхолдеры параметров запроса. */
export function scrubTileParamsInImportedText(text: string): string {
  if (!text) return text
  let out = scrubExamplePhoneInImportedText(text)

  const exampleContractIds = [
    '69cf923c18aa73dcae91217b',
    '67f907d98d9df89c1ad88571',
    '69b26747006f06669b47244d',
  ]
  for (const id of exampleContractIds) {
    out = out.split(id).join('{{contractId}}')
  }

  const exampleUserIds = [
    '693a855cd722d915e6170696',
    '689edb8a27385a0040bfc568',
    '69b415803a0191fa76a1d992',
  ]
  for (const id of exampleUserIds) {
    out = out.split(id).join('{{userId}}')
  }

  const exampleTemplateIds = ['69cfd50e18aa73dcae919562', '68ca89aa21e5a67674421faa']
  for (const id of exampleTemplateIds) {
    out = out.split(id).join('{{templateId}}')
  }

  // Числовые поля — без кавычек вокруг плейсхолдера, иначе API получит строку "5" вместо 5
  out = out.replace(/"prepaid_contracts_count"\s*:\s*\d+/g, '"prepaid_contracts_count": {{prepaidContractsCount}}')
  out = out.replace(/"prepaid_contracts_count"\s*:\s*"{{prepaidContractsCount}}"/g, '"prepaid_contracts_count": {{prepaidContractsCount}}')
  out = out.replace(/"days"\s*:\s*\d+/g, '"days": {{days}}')
  out = out.replace(/"days"\s*:\s*"{{days}}"/g, '"days": {{days}}')
  out = out.replace(/"ai_chat_balance"\s*:\s*\d+/g, '"ai_chat_balance": {{aiChatBalance}}')
  out = out.replace(/"ai_chat_balance"\s*:\s*"{{aiChatBalance}}"/g, '"ai_chat_balance": {{aiChatBalance}}')
  out = out.replace(/"channel"\s*:\s*"([^"]+)"/g, (full, ch) => {
    if (ch === 'tg' || ch === 'telegram') return '"channel": "tg-gateway"'
    if (['sms', 'call', 'tg-gateway'].includes(ch)) return full
    return '"channel": "{{channel}}"'
  })
  out = out.replace(/"contract_id"\s*:\s*"[^"]+"/g, '"contract_id": "{{contractId}}"')
  out = out.replace(/"package_id"\s*:\s*"[^"]+"/g, '"package_id": "{{packageId}}"')
  out = out.replace(/"user_id"\s*:\s*"[^"]+"/g, '"user_id": "{{userId}}"')
  out = out.replace(/"note"\s*:\s*"[^"]+"/g, '"note": "{{note}}"')
  out = out.replace(/"template_id"\s*:\s*"[^"]+"/g, '"template_id": "{{templateId}}"')
  // Опечатка в коллекции API — сохраняем ключ, значение всё равно шаблонизируем.
  out = out.replace(/"templaet_id"\s*:\s*"[^"]+"/g, '"templaet_id": "{{templateId}}"')

  if (/\bcontract_id=/.test(out)) {
    out = out.replace(/(contract_id=)([a-f0-9]{24})/gi, '$1{{contractId}}')
  }

  return out
}

/** api_key + литералы плитки за один проход импорта. */
export function scrubImported(text: string, examplePartnerKey: string): string {
  return scrubTileParamsInImportedText(scrubPartnerApiKeyInImportedText(text, examplePartnerKey))
}
