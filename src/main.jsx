import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Точка входа: монтируем приложение в #root из index.html
createRoot(document.getElementById('root')).render(
	<App />
)
