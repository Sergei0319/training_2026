/**
 * Валидаторы плитки: телефон, email, ИНН, ObjectId (экзамен 2.1, сообщения об ошибках).
 * Контракт: `null` — ок, строка — текст с именем поля.
 */

/** Простая проверка email: локальная часть, @, домен с точкой (без RFC-полноты). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Берёт первое сообщение из карты ошибок полей (порядок ключей объекта).
 */
export function firstErrorMessage(errors: Record<string, string>): string | null {
  return Object.values(errors)[0] ?? null
}

/**
 * Проверяет телефон РФ: 10 цифр или 11 с ведущей 7/8.
 * Буквы отклоняются отдельно — иначе пользователь не понимает, почему «обрезались» символы.
 * @param options.required по умолчанию true; `false` разрешает пустую строку
 */
export function validatePhoneValue(
  raw: string,
  options?: { required?: boolean; label?: string },
): string | null {
  const label = options?.label ?? 'Номер телефона'
  const trimmed = raw.trim()
  if (!trimmed) {
    return options?.required === false ? null : `Поле «${label}» неверно: укажите номер`
  }
  if (/[A-Za-zА-Яа-яЁё]/.test(trimmed)) {
    return `Поле «${label}» неверно: номер должен состоять из цифр`
  }
  const digits = trimmed.replace(/\D/g, '')
  if (!digits.length) {
    return `Поле «${label}» неверно: укажите цифры номера`
  }
  if (digits.length < 10) {
    return `Поле «${label}» неверно: номер неполный (сейчас ${digits.length} из 10–11 цифр)`
  }
  if (digits.length === 10) return null
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) return null
  if (digits.length === 11) {
    return `Поле «${label}» неверно: 11-значный номер должен начинаться с 7 или 8`
  }
  return `Поле «${label}» неверно: слишком много цифр (${digits.length}, нужно 10 или 11)`
}

/**
 * Проверяет MongoDB ObjectId: ровно 24 hex-символа без пробелов.
 */
export function validateMongoObjectId(
  raw: string,
  options?: { required?: boolean; label?: string },
): string | null {
  const label = options?.label ?? 'ID'
  const trimmed = raw.trim()
  if (!trimmed) {
    return options?.required === false ? null : `Поле «${label}» неверно: укажите идентификатор`
  }
  if (/\s/.test(trimmed)) {
    return `Поле «${label}» неверно: уберите пробелы`
  }
  if (!/^[a-fA-F0-9]+$/.test(trimmed)) {
    return `Поле «${label}» неверно: допустимы только символы 0–9 и a–f`
  }
  if (trimmed.length < 24) {
    return `Поле «${label}» неверно: ID неполный (сейчас ${trimmed.length} из 24 символов)`
  }
  if (trimmed.length > 24) {
    return `Поле «${label}» неверно: ID слишком длинный (${trimmed.length} из 24 символов)`
  }
  return null
}

/**
 * Проверяет email: непусто (если required), нет пробелов, есть «@», затем общая маска.
 */
export function validateEmailValue(
  raw: string,
  options?: { required?: boolean; label?: string },
): string | null {
  const label = options?.label ?? 'Email'
  const trimmed = raw.trim()
  if (!trimmed) {
    return options?.required === false ? null : `Поле «${label}» неверно: укажите адрес`
  }
  if (trimmed.includes(' ')) {
    return `Поле «${label}» неверно: уберите пробелы`
  }
  if (!trimmed.includes('@')) {
    return `Поле «${label}» неверно: в адресе нет «@»`
  }
  if (!EMAIL_RE.test(trimmed)) {
    return `Поле «${label}» неверно: укажите адрес вида user@example.com`
  }
  return null
}

/**
 * Проверяет ИНН: только цифры, 10 (ИП/юрлицо) или 12 (физлицо). 11 цифр — всегда ошибка.
 */
export function validateTaxIdValue(
  raw: string,
  options?: { required?: boolean; label?: string },
): string | null {
  const label = options?.label ?? 'ИНН'
  const trimmed = raw.trim()
  if (!trimmed) {
    return options?.required === false ? null : `Поле «${label}» неверно: укажите ИНН`
  }
  if (/\D/.test(trimmed)) {
    return `Поле «${label}» неверно: ИНН должен состоять только из цифр`
  }
  if (trimmed.length < 10) {
    return `Поле «${label}» неверно: ИНН неполный (сейчас ${trimmed.length} из 10 или 12 цифр)`
  }
  if (trimmed.length === 11 || trimmed.length > 12) {
    return `Поле «${label}» неверно: укажите 10 цифр (ИП/юрлицо) или 12 (физлицо)`
  }
  return null
}
