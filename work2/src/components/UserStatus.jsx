import { useEffect } from 'react'

function UserStatus({ isLoggedIn, onLogin }) {
  useEffect(() => {
    if (isLoggedIn) {
      console.log('Пользователь в системе')
    }
  }, [isLoggedIn])

  if (isLoggedIn) {
    return <p className="welcome-message">Добро пожаловать, пользователь!</p>
  }

  return (
    <button type="button" className="btn btn-primary" onClick={onLogin}>
      Войти
    </button>
  )
}

export default UserStatus
