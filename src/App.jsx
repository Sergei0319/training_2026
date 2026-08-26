import { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './components/Home'
import Profile from './components/Profile'
import Contacts from './components/Contacts'
import './App.css'

function App() {
	// Какая вкладка сейчас открыта: 'home' | 'profile' | 'contacts'
	const [tab, setTab] = useState('home')
	// true — Profile бросает ошибку при рендере; после «Попробовать снова» станет false
	const [profileShouldThrow, setProfileShouldThrow] = useState(true)

	return (
		<main className="app">
			<h1>Навигация по вкладкам с ErrorBoundary</h1>
			<div className="tabs">
				<button type="button" onClick={() => setTab('home')}>
					Главная
				</button>
				<button type="button" onClick={() => setTab('profile')}>
					Профиль
				</button>
				<button type="button" onClick={() => setTab('contacts')}>
					Контакты
				</button>
			</div>

			{/* Каждая вкладка в своём ErrorBoundary: ошибка одной не роняет остальные. */}
			{tab === 'home' && (
				<ErrorBoundary>
					<Home />
				</ErrorBoundary>
			)}
			{tab === 'profile' && (
				<ErrorBoundary onReset={() => setProfileShouldThrow(false)}>
					<Profile shouldThrow={profileShouldThrow} />
				</ErrorBoundary>
			)}
			{tab === 'contacts' && (
				<ErrorBoundary>
					<Contacts />
				</ErrorBoundary>
			)}
		</main>
	)
}

export default App
