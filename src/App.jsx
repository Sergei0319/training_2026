import { AuthProvider } from './context/AuthContext'
import UserPanel from './components/UserPanel'
import './App.css'

// Уровень 1 — главная страница: оборачивает дерево в AuthProvider
function App() {
	return (
		<AuthProvider>
			<main className="app">
				<h1>Главная страница</h1>
				<UserPanel />
			</main>
		</AuthProvider>
	)
}

export default App
