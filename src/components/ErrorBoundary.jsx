import { Component } from 'react'

// ErrorBoundary может быть только классовым компонентом:
// хуки не умеют ловить ошибки рендера дочерних компонентов.
class ErrorBoundary extends Component {
	constructor(props) {
		super(props)
		// hasError: показывать запасной UI вместо сломавшегося ребёнка
		this.state = { hasError: false }
	}

	// React вызывает этот метод, если потомок выбросил ошибку при рендере.
	static getDerivedStateFromError() {
		return { hasError: true }
	}

	// «Попробовать снова»: сбрасываем ошибку и даём компоненту отрисоваться заново.
	handleRetry = () => {
		this.props.onReset?.()
		this.setState({ hasError: false })
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="error-fallback">
					<p>Не удалось загрузить компонент.</p>
					<button type="button" onClick={this.handleRetry}>
						Попробовать снова
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
