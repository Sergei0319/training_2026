/**
 * «Книжное» представление JSON-ответа: секции, пары полей, вложенные объекты и списки.
 * Скаляры на корне выносятся в «Основное»; объекты/массивы сортируются по PRIORITY_KEYS.
 */
import type { ReactNode } from 'react'
import type { DokiJson } from '../../doki/client'
import { labelForKey } from '../../doki/labels'
import './BookResponseView.scss'

type JsonObject = Record<string, DokiJson>

/** Объект без массива (для вложенных секций). */
function isPlainObject(v: unknown): v is JsonObject {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Скаляр JSON: null, строка, число, булево — не объект и не массив. */
function isPrimitive(v: DokiJson): boolean {
  return v === null || typeof v !== 'object'
}

/** Приоритетные ключи, которые показываются раньше остальных верхнеуровневых секций. */
const PRIORITY_KEYS = [
  'user',
  'users',
  'profile',
  'customer',
  'client',
  'entrepreneur',
  'signer',
  'transaction',
  'transactions',
  'payment',
  'payments',
  'contract',
  'contracts',
  'cards',
  'card',
  'attachments',
  'history',
  'events',
  'items',
  'data',
]

/** Стабильный порядок секций: известные ключи раньше, остальные — как были, после приоритетных. */
function sortEntriesByPriority<T>(entries: [string, T][]): [string, T][] {
  const idx = (k: string): number => {
    const i = PRIORITY_KEYS.indexOf(k.toLowerCase())
    return i === -1 ? PRIORITY_KEYS.length : i
  }
  return [...entries].sort((a, b) => idx(a[0]) - idx(b[0]))
}

/** Рендер скаляра: пустые строки и null — «—», http(s) — ссылка. */
function renderPrimitive(v: DokiJson): ReactNode {
  if (v === null) return <span className="book-view__null">—</span>
  if (typeof v === 'boolean') return <span>{v ? 'да' : 'нет'}</span>
  if (typeof v === 'number') return <span>{String(v)}</span>
  if (typeof v === 'string') {
    if (v === '') return <span className="book-view__null">—</span>
    if (/^https?:\/\//i.test(v)) {
      return (
        <a href={v} target="_blank" rel="noreferrer" className="book-view__link">
          {v}
        </a>
      )
    }
    return <span>{v}</span>
  }
  return <span>{String(v)}</span>
}

/** Список пар «подпись — значение» для скаляров одного объекта. */
function Pairs({ entries }: { entries: [string, DokiJson][] }) {
  if (!entries.length) return null
  return (
    <dl className="book-view__pairs">
      {entries.map(([k, v]) => (
        <div key={k} className="book-view__pair">
          <dt className="book-view__pair-label">{labelForKey(k)}</dt>
          <dd className="book-view__pair-value">{renderPrimitive(v)}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Раскладывает поля объекта на скаляры, вложенные объекты и массивы. */
function splitEntries(obj: JsonObject): {
  primitives: [string, DokiJson][]
  objects: [string, JsonObject][]
  arrays: [string, DokiJson[]][]
} {
  const primitives: [string, DokiJson][] = []
  const objects: [string, JsonObject][] = []
  const arrays: [string, DokiJson[]][] = []
  for (const [k, v] of Object.entries(obj)) {
    if (isPrimitive(v)) primitives.push([k, v])
    else if (isPlainObject(v)) objects.push([k, v])
    else if (Array.isArray(v)) arrays.push([k, v as DokiJson[]])
  }
  return { primitives, objects, arrays }
}

/** Массив: объекты — нумерованные подразделы, иначе маркированный список скаляров. */
function ArrayBody({ arr, level }: { arr: DokiJson[]; level: number }) {
  if (arr.length === 0) return <p className="book-view__note">Пустой список</p>
  if (arr.every((x) => isPlainObject(x))) {
    return (
      <>
        {(arr as JsonObject[]).map((item, i) => (
          <SubSection key={i} title={`Запись ${i + 1}`} level={level}>
            <ObjectBody obj={item} level={level + 1} />
          </SubSection>
        ))}
      </>
    )
  }
  return (
    <ul className="book-view__list">
      {arr.map((item, i) => (
        <li key={i}>{renderPrimitive(item)}</li>
      ))}
    </ul>
  )
}

/** Содержимое объекта: сначала пары, затем вложенные объекты и массивы. */
function ObjectBody({ obj, level }: { obj: JsonObject; level: number }) {
  const { primitives, objects, arrays } = splitEntries(obj)
  const sortedObjects = sortEntriesByPriority(objects)
  const sortedArrays = sortEntriesByPriority(arrays)
  return (
    <>
      <Pairs entries={primitives} />
      {sortedObjects.map(([k, v]) => (
        <SubSection key={k} title={labelForKey(k)} level={level}>
          <ObjectBody obj={v} level={level + 1} />
        </SubSection>
      ))}
      {sortedArrays.map(([k, v]) => (
        <SubSection key={k} title={labelForKey(k)} level={level}>
          <ArrayBody arr={v} level={level + 1} />
        </SubSection>
      ))}
    </>
  )
}

/** Верхнеуровневая секция с заголовком (корень ответа). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="book-view__section">
      <h3 className="book-view__section-title">{title}</h3>
      <div className="book-view__section-body">{children}</div>
    </section>
  )
}

/** Вложенная секция; CSS-уровень ограничен 3, чтобы отступы не росли бесконечно. */
function SubSection({
  title,
  level,
  children,
}: {
  title: string
  level: number
  children: ReactNode
}) {
  return (
    <section className={`book-view__sub book-view__sub--lvl-${Math.min(level, 3)}`}>
      <h4 className="book-view__sub-title">{title}</h4>
      <div className="book-view__sub-body">{children}</div>
    </section>
  )
}

/** Маркер `__binary__:contentType:length` → одна читаемая строка. */
function formatBinaryLine(data: string): string {
  const parts = data.split(':')
  const ct = parts[1] || ''
  const len = parts[2] || '?'
  return `Файл: ${ct || 'бинарные данные'}, размер ${len} байт.`
}

/**
 * Корневой вид ответа API: строка, null, массив или объект, разложенный по секциям.
 */
export function BookResponseView({ data }: { data: DokiJson | string }) {
  if (typeof data === 'string') {
    if (data.startsWith('__binary__:')) {
      return <p className="book-view__note">{formatBinaryLine(data)}</p>
    }
    return <pre className="book-view__text">{data}</pre>
  }
  if (data === null) {
    return <p className="book-view__note">Пустой ответ (null)</p>
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="book-view__note">Пустой список</p>
    }
    if (data.every((x) => isPlainObject(x))) {
      return (
        <div className="book-view">
          {(data as JsonObject[]).map((item, i) => (
            <Section key={i} title={`Запись ${i + 1}`}>
              <ObjectBody obj={item} level={1} />
            </Section>
          ))}
        </div>
      )
    }
    return (
      <div className="book-view">
        <Section title="Список значений">
          <ul className="book-view__list">
            {data.map((item, i) => (
              <li key={i}>{renderPrimitive(item)}</li>
            ))}
          </ul>
        </Section>
      </div>
    )
  }
  if (!isPlainObject(data)) {
    return <p className="book-view__note">{renderPrimitive(data)}</p>
  }

  const { primitives, objects, arrays } = splitEntries(data)
  const sortedObjects = sortEntriesByPriority(objects)
  const sortedArrays = sortEntriesByPriority(arrays)

  return (
    <div className="book-view">
      {primitives.length > 0 ? (
        <Section title="Основное">
          <Pairs entries={primitives} />
        </Section>
      ) : null}
      {sortedObjects.map(([k, v]) => (
        <Section key={k} title={labelForKey(k)}>
          <ObjectBody obj={v} level={1} />
        </Section>
      ))}
      {sortedArrays.map(([k, v]) => (
        <Section key={k} title={labelForKey(k)}>
          <ArrayBody arr={v} level={1} />
        </Section>
      ))}
    </div>
  )
}
