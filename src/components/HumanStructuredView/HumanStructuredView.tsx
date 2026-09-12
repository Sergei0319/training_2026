/**
 * Компактное «человеческое» дерево JSON: пары ключ–значение, списки и таблица массивов объектов.
 * Бинарный маркер `__binary__:` показывается одной строкой, без разбора содержимого файла.
 */
import type { ReactNode } from 'react'
import type { DokiJson } from '../../doki/client'
import { labelForKey } from '../../doki/labels'
import './HumanStructuredView.scss'

/** Обычный объект (не массив и не null) — для табличного представления списков. */
function isPlainObject(v: unknown): v is Record<string, DokiJson> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Древовидное представление без JSON-строки в основном блоке. */
export function HumanStructuredView({ data }: { data: DokiJson | string }) {
  if (typeof data === 'string') {
    if (data.startsWith('__binary__:')) {
      return <p className="human-view__p">{formatBinaryLine(data)}</p>
    }
    return <pre className="human-view__pre human-view__pre--text">{data}</pre>
  }
  return <div className="human-view__tree">{renderValue(data, 0)}</div>
}

/** Маркер `__binary__:contentType:length` → одна читаемая строка. */
function formatBinaryLine(data: string): string {
  const parts = data.split(':')
  const ct = parts[1] || ''
  const len = parts[2] || '?'
  return `Файл: ${ct || 'бинарные данные'}, размер ${len} байт.`
}

/** Рекурсивный рендер значения; глубина > 8 обрезается, чтобы не зациклиться на огромных деревьях. */
function renderValue(val: DokiJson, depth: number): ReactNode {
  if (val === null) return <span className="human-view__null">null</span>
  if (typeof val === 'boolean') return <span>{val ? 'да' : 'нет'}</span>
  if (typeof val === 'number') return <span>{String(val)}</span>
  if (typeof val === 'string') {
    const isUrl = /^https?:\/\//i.test(val)
    if (isUrl) {
      return (
        <a href={val} className="human-view__link" target="_blank" rel="noreferrer">
          {val}
        </a>
      )
    }
    return <span>{val}</span>
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="human-view__muted">пустой список</span>
    if (val.every((x) => isPlainObject(x))) {
      return renderObjectTable(val as Record<string, DokiJson>[])
    }
    return (
      <ul className="human-view__ul">
        {val.map((item, i) => (
          <li key={i} className="human-view__li">
            {renderValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }
  if (depth > 8) return <span className="human-view__muted">…</span>
  const entries = Object.entries(val)
  return (
    <dl className="human-view__dl">
      {entries.map(([k, v]) => (
        <div key={k} className="human-view__dl-row">
          <dt className="human-view__dl-dt">{labelForKey(k)}</dt>
          <dd className="human-view__dl-dd">{renderValue(v, depth + 1)}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Таблица: объединяем ключи всех объектов, отсутствующие ячейки — «—». */
function renderObjectTable(rows: Record<string, DokiJson>[]): ReactNode {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  return (
    <div className="human-view__table-wrap">
      <table className="human-view__table">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{labelForKey(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>{row[k] != null ? renderValue(row[k], 2) : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
