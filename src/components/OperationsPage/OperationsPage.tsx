/**
 * Страница «Операции» (экзамен 2.1): таблица сущности, фильтр, сортировка;
 * отсюда Create / Read / Update / Delete. Стили — CSS Modules (экзамен 2.2).
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMethods, useRunner } from '../../desk/hooks'
import { PATHS } from '../../auth/paths'
import type { SavedMethod } from '../../methods/types'
import styles from './OperationsPage.module.scss'

/** Колонки, по которым можно сортировать таблицу. */
type SortKey = 'label' | 'method' | 'path' | 'apiHost'
/** Направление сортировки. */
type SortDir = 'asc' | 'desc'

/**
 * Подпись операции: кнопка, иначе имя, иначе заглушка.
 * @param m сохранённый метод
 */
function labelOf(m: SavedMethod): string {
  return (m.buttonLabel || m.name || 'Без названия').trim()
}

/** CRUD-таблица операций поддержки: фильтры, сортировка, переход в редактор. */
export function OperationsPage() {
  const navigate = useNavigate()
  const { methods, setSelectedId, addMethod, deleteMethodById } = useMethods()
  const { busy, runMethod } = useRunner()
  // Экзамен 2.2: локальное состояние фильтров и сортировки таблицы — useState.
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [hostFilter, setHostFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  /** Уникальные HTTP-методы из текущего набора — опции фильтра. */
  const methodOptions = useMemo(() => {
    const set = new Set(methods.map((m) => m.method.toUpperCase()))
    return [...set].sort()
  }, [methods])

  /** Поиск по названию/пути, фильтры HTTP и хоста, затем localeCompare по ru. */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = methods.filter((m) => {
      const hay = `${labelOf(m)} ${m.path}`.toLowerCase()
      const matchQuery = !q || hay.includes(q)
      const matchMethod = methodFilter === 'all' || m.method.toUpperCase() === methodFilter
      const matchHost = hostFilter === 'all' || m.apiHost === hostFilter
      return matchQuery && matchMethod && matchHost
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'label' ? labelOf(a) : String(a[sortKey])
      const bv = sortKey === 'label' ? labelOf(b) : String(b[sortKey])
      return av.localeCompare(bv, 'ru') * dir
    })
  }, [methods, query, methodFilter, hostFilter, sortKey, sortDir])

  /** Повторный клик по той же колонке меняет направление; новая колонка — asc. */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  /** Стрелка в заголовке только у активной колонки сортировки. */
  const sortMark = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '')

  /** Выбрать метод и открыть форму в «Настройках». */
  const openEditor = (id: string) => {
    setSelectedId(id)
    navigate(PATHS.settings)
  }

  return (
    <section>
      <p className="oki-lead">
        Список операций поддержки: создание, просмотр, изменение и удаление. Можно отфильтровать и отсортировать
        таблицу.
      </p>
      <div className={styles.toolbar}>
        <label className={styles.filter}>
          <span className={styles.filterLabel}>Поиск</span>
          <input
            className="field__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название или путь"
          />
        </label>
        <label className={styles.filter}>
          <span className={styles.filterLabel}>HTTP</span>
          <select className="field__input" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="all">Все</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span className={styles.filterLabel}>Хост</span>
          <select className="field__input" value={hostFilter} onChange={(e) => setHostFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="doki.online">api.doki.online</option>
            <option value="okidoki.ru">api.okidoki.ru</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            addMethod()
            navigate(PATHS.settings)
          }}
        >
          Создать
        </button>
      </div>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-sort={sortKey === 'label' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sort} onClick={() => toggleSort('label')}>
                  Операция{sortMark('label')}
                </button>
              </th>
              <th aria-sort={sortKey === 'method' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sort} onClick={() => toggleSort('method')}>
                  Метод{sortMark('method')}
                </button>
              </th>
              <th aria-sort={sortKey === 'path' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sort} onClick={() => toggleSort('path')}>
                  Путь{sortMark('path')}
                </button>
              </th>
              <th aria-sort={sortKey === 'apiHost' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sort} onClick={() => toggleSort('apiHost')}>
                  Хост{sortMark('apiHost')}
                </button>
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Нет операций по заданным условиям.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id}>
                  <td>{labelOf(m)}</td>
                  <td>
                    <code>{m.method}</code>
                  </td>
                  <td>
                    <code>{m.path}</code>
                  </td>
                  <td>{m.apiHost === 'okidoki.ru' ? 'api.okidoki.ru' : 'api.doki.online'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className="btn btn--sm" disabled={busy} onClick={() => void runMethod(m)}>
                        Выполнить
                      </button>
                      <button type="button" className="btn btn--sm" onClick={() => openEditor(m.id)}>
                        Изменить
                      </button>
                      <button type="button" className="btn btn--sm btn--danger" onClick={() => deleteMethodById(m.id)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="muted oki-hint">
        Показано {rows.length} из {methods.length}. «Изменить» открывает форму в разделе «Настройки».
      </p>
    </section>
  )
}
