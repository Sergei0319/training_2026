import { useState } from 'react'

// Хук счётчика: хранит значение и отдаёт increment / decrement / reset.
// initialValue — стартовое значение, step — шаг изменения (по умолчанию 1).
function useCounter(initialValue = 0, step = 1) {
	const [count, setCount] = useState(initialValue)

	const increment = () => setCount((prev) => prev + step)
	const decrement = () => setCount((prev) => prev - step)
	const reset = () => setCount(initialValue)

	return { count, increment, decrement, reset }
}

export default useCounter
