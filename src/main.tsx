/**
 * Точка входа SPA: монтирует React-дерево в `#root`.
 * StrictMode ловит побочные эффекты в разработке (двойной вызов эффектов).
 * BrowserRouter — навигация без перезагрузки (экзамен 2.2, маршрутизация).
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.scss'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
