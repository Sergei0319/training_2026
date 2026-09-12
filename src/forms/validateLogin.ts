/**
 * Валидация входа: телефон и SMS-код (экзамен 2.1, клиентская валидация форм).
 * Возвращает текст ошибки или `null`, если значение корректно.
 */
import { validatePhoneValue } from './validateTileField'

/**
 * Проверяет номер телефона как обязательное поле (общие правила — в validatePhoneValue).
 * @returns сообщение об ошибке или `null`
 */
export function validatePhone(raw: string): string | null {
  return validatePhoneValue(raw, { required: true })
}

/**
 * Проверяет SMS-код: только цифры, длина 4–6 (типичный диапазон кодов API).
 * @returns сообщение об ошибке или `null`
 */
export function validateSmsCode(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Поле «Код из SMS» неверно: введите код'
  if (!/^\d+$/.test(trimmed)) return 'Поле «Код из SMS» неверно: код должен состоять из цифр'
  if (trimmed.length < 4) {
    return `Поле «Код из SMS» неверно: код неполный (сейчас ${trimmed.length} из 4–6 цифр)`
  }
  if (trimmed.length > 6) {
    return `Поле «Код из SMS» неверно: слишком длинный код (${trimmed.length} из 4–6 цифр)`
  }
  return null
}
