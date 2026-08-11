import { createContext, useState } from 'react'

// 1. Создаём контекст авторизации
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const [userName, setUserName] = useState('')

	const login = name => {
		setUserName(name.trim())
	}

	const logout = () => {
		setUserName('')
	}

	// 2. Централизуем состояние и отдаём его через Provider
	return (
		<AuthContext.Provider value={{ userName, login, logout }}>
			{children}
		</AuthContext.Provider>
	)
}
