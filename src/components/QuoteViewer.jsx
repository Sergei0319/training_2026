import { Component } from 'react'

// Заранее заданный массив цитат, из которого компонент выбирает случайную
const QUOTES = [
	'Лучше поздно, чем никогда.',
	'Век живи — век учись.',
	'Не имей сто рублей, а имей сто друзей.',
	'Тише едешь — дальше будешь.',
	'Семь раз отмерь, один раз отрежь.',
	'Без труда не выловишь и рыбку из пруда.',
]

// Возвращает случайную цитату. Если передан exclude — эту цитату не берём,
// чтобы по кнопке «Следующая» всегда показывалась другая фраза.
function getRandomQuote(exclude) {
	const others = QUOTES.filter((quote) => quote !== exclude)
	return others[Math.floor(Math.random() * others.length)]
}

// Класс-компонент: состояние и методы жизненного цикла задаются в классе,
// а не через хуки (useState / useEffect).
class QuoteViewer extends Component {
	// constructor вызывается первым, один раз при создании экземпляра.
	// Здесь инициализируем state — текущую отображаемую цитату.
	constructor(props) {
		super(props) // обязательно вызвать super(props) до обращения к this
		this.state = {
			quote: getRandomQuote(),
		}
	}

	// Вызывается сразу после того, как компонент появился в DOM (монтирование).
	// Срабатывает при первом показе и снова после «Показать цитаты».
	componentDidMount() {
		console.log('QuoteViewer: компонент смонтирован')
	}

	// Вызывается после каждого обновления (повторный render), но не после первого.
	// Здесь это нажатие «Следующая цитата» → setState → новый render.
	componentDidUpdate(prevProps, prevState) {
		console.log('QuoteViewer: компонент обновлён')
		console.log('Было:', prevState.quote) // state до обновления
		console.log('Стало:', this.state.quote) // актуальный state
	}

	// Вызывается прямо перед удалением компонента из DOM (размонтирование).
	// Срабатывает при нажатии «Скрыть цитаты» в App.
	componentWillUnmount() {
		console.log('QuoteViewer: компонент размонтирован')
	}

	// Обработчик кнопки: setState меняет quote → React перерисует компонент.
	handleNextQuote = () => {
		this.setState({ quote: getRandomQuote(this.state.quote) })
	}

	// render описывает, что показать на экране. Вызывается при монтировании
	// и при каждом изменении state.
	render() {
		return (
			<section className="quote-viewer">
				<p className="quote-viewer__text">{this.state.quote}</p>
				<button type="button" onClick={this.handleNextQuote}>
					Следующая цитата
				</button>
			</section>
		)
	}
}

export default QuoteViewer
