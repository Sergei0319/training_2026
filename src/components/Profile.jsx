// Вкладка «Профиль»: специально падает при рендере, чтобы сработал ErrorBoundary.
function Profile({ shouldThrow = true }) {
	if (shouldThrow) {
		throw new Error('Ошибка профиля')
	}

	return (
		<section>
			<p>Имя: Иван Грозный</p>
			<p>Статус: профиль загружен</p>
		</section>
	)
}

export default Profile
