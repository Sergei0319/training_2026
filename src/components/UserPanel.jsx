import AuthControls from './AuthControls'

// Уровень 2 — промежуточный: не принимает и не пробрасывает пропсы авторизации
function UserPanel() {
	return (
		<section className="user-panel">
			<h2>Панель пользователя</h2>
			<AuthControls />
		</section>
	)
}

export default UserPanel
