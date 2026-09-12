/**
 * Универсальные key-value поля плитки: каталог, дефолты, JSON с вложенностью по «.»,
 * нормализация сохранённого массива (чужие ключи отбрасываются).
 */

/** Одна строка формы: ключ API и строковое значение. */
export type KeyValueFieldEntry = {
  key: string
  value: string
}

/** Описание поля в каталоге: подпись, дефолт, text/select, опциональная группа UI. */
export type KeyValueFieldCatalogItem = {
  key: string
  label: string
  defaultValue: string
  group?: string
  inputMode: 'text' | 'select'
  options?: { value: string; label: string }[]
}

/**
 * Поля каталога, которых ещё нет среди активных ключей (кнопка «добавить поле»).
 */
export function getAvailableKeys(
  catalog: KeyValueFieldCatalogItem[],
  activeKeys: Set<string>,
): KeyValueFieldCatalogItem[] {
  const known = new Set(catalog.map((d) => d.key))
  return catalog.filter((d) => !activeKeys.has(d.key) && known.has(d.key))
}

/** Элемент каталога по ключу или undefined. */
export function getCatalogItem(
  catalog: KeyValueFieldCatalogItem[],
  key: string,
): KeyValueFieldCatalogItem | undefined {
  return catalog.find((d) => d.key === key)
}

/** Все поля каталога с defaultValue — стартовое состояние формы. */
export function getDefaultEntries(catalog: KeyValueFieldCatalogItem[]): KeyValueFieldEntry[] {
  return catalog.map((d) => ({ key: d.key, value: d.defaultValue }))
}

/** Пишет value по пути a.b.c, создавая промежуточные объекты. */
function setNested(target: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split('.')
  let cur: Record<string, unknown> = target
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const next = cur[part]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cur[part] = {}
    }
    cur = cur[part] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

/** Собирает JSON-тело из плоского списка ключей (в т.ч. passport.number). */
export function buildNestedJsonBody(entries: KeyValueFieldEntry[]): string {
  const obj: Record<string, unknown> = {}
  for (const { key, value } of entries) {
    const k = key.trim()
    const v = value.trim()
    if (!k || !v) continue
    if (k.includes('.')) {
      setNested(obj, k, v)
    } else {
      obj[k] = v
    }
  }
  return JSON.stringify(obj, null, 2)
}

/**
 * Приводит unknown из storage к списку известных ключей.
 * Пустой/битый ввод → дефолты каталога, чтобы форма не осталась пустой.
 */
export function normalizeKeyValueEntries(
  raw: unknown,
  catalog: KeyValueFieldCatalogItem[],
): KeyValueFieldEntry[] {
  const known = new Set(catalog.map((d) => d.key))
  if (!Array.isArray(raw)) return getDefaultEntries(catalog)
  const out: KeyValueFieldEntry[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const key = typeof r.key === 'string' ? r.key.trim() : ''
    const value = typeof r.value === 'string' ? r.value : ''
    if (!key || !known.has(key)) continue
    out.push({ key, value })
  }
  return out.length ? out : getDefaultEntries(catalog)
}
