import useCounter from '../hooks/useCounter'

function Counter() {
	const { count, increment, decrement, reset } = useCounter(0, 1)

	return (
		<section>
			<p>Текущее значение: {count}</p>
			<div className="counter-buttons">
				<button type="button" onClick={increment}>
					Увеличить
				</button>
				<button type="button" onClick={decrement}>
					Уменьшить
				</button>
				<button type="button" onClick={reset}>
					Сбросить
				</button>
			</div>
		</section>
	)
}

export default Counter
