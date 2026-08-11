import { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'

// Уровень 3 — самый глубокий: читает имя и функции только из контекста
function AuthControls() {
	const { userName, login, logout } = useContext(AuthContext)
	const [inputValue, setInputValue] = useState('')

	const handleLogin = () => {
		if (!inputValue.trim()) return
		login(inputValue)
		setInputValue('')
	}

	if (userName) {
		return (
			<div className="auth-controls">
				<p className="auth-controls__greeting">Привет, {userName}!</p>
				<button type="button" onClick={logout}>
					Выйти
				</button>
			</div>
		)
	}

	return (
		<div className="auth-controls">
			<input
				type="text"
				placeholder="Введите имя"
				value={inputValue}
				onChange={e => setInputValue(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter') handleLogin()
				}}
			/>
			<button type="button" onClick={handleLogin}>
				Войти
			</button>
		</div>
	)
}

export default AuthControls
