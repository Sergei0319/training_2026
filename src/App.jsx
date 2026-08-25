import { useState } from 'react'
import QuoteViewer from './components/QuoteViewer'
import './App.css'

function App() {
	const [visible, setVisible] = useState(true)

	return (
		<main className="app">
			<h1>Просмотр цитат</h1>
			<button type="button" onClick={() => setVisible((prev) => !prev)}>
				{visible ? 'Скрыть цитаты' : 'Показать цитаты'}
			</button>
			{visible && <QuoteViewer />}
		</main>
	)
}

export default App
