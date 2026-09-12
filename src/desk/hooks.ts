/**
 * Хуки-срезы `DeskContext`: компоненты импортируют только нужный кусок стола.
 * Без провайдера бросаем ошибку сразу — иначе падение будет глубже и непонятнее.
 */
import { useContext } from 'react'
import { DeskContext } from './deskContext'

function useDesk() {
  const value = useContext(DeskContext)
  if (!value) throw new Error('DeskProvider is required')
  return value
}

/** Сессия поддержки: гейт, токен, логин/логаут. */
export const useAuth = () => useDesk().auth
/** Ключ партнёра и базовые URL API. */
export const useSettings = () => useDesk().settings
/** Карты параметров и спец-форм по id метода. */
export const useFields = () => useDesk().fields
/** Запуск запросов, журнал и активный результат. */
export const useRunner = () => useDesk().runner
/** Список операций, выбор, импорт/экспорт и настройки плиток. */
export const useMethods = () => useDesk().methods
