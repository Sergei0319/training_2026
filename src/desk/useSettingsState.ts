/**
 * Настройки кабинета: partner API key в localStorage и закэшированные базы URL Doki / Okidoki.
 * Базы считаем один раз: смена env требует перезагрузки страницы, а не ререндера.
 */
import { useEffect, useMemo, useState } from 'react'
import { getApiBase, getOkidokiApiBase } from '../doki/apiBase'
import { LS, loadLs, saveLs } from './persist'

/**
 * Хук настроек. Ключ партнёра пишется при каждом изменении — отдельной кнопки «Сохранить» нет.
 */
export function useSettingsState() {
  const [partnerApiKey, setPartnerApiKey] = useState(() => loadLs(LS.partner))
  useEffect(() => saveLs(LS.partner, partnerApiKey), [partnerApiKey])
  const dokiBase = useMemo(() => getApiBase(), [])
  const okiBase = useMemo(() => getOkidokiApiBase(), [])
  return { partnerApiKey, setPartnerApiKey, dokiBase, okiBase }
}
