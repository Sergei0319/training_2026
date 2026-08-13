import {useState, useCallback}  from "react";
import TodoItem from './components/TodoItem'
import './App.css'

const INITIAL_TODOS = [
    { id: 1, text: 'Сделать домашку по Rect', completed: false },
    { id: 2, text: 'Закрыть рабочие задачи', completed: false },
    { id: 3, text: 'Написать код', completed: false },
]

function App() {
    const [todos, setTodos] = useState(INITIAL_TODOS)
    const [text, setText] = useState('')

    const addTodo = (event) => {
        event.preventDefault()
        const trimmed = text.trim()
        if (!trimmed) return

        setTodos((prev) => [
            ...prev,
            {id: Date.now(), text: trimmed, completed: false},
        ])
        setText('')
    }

    const toggleTodo = useCallback((id) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? {...todo, completed: !todo.completed} : todo,
            ),
        )
    }, [])

    const deleteTodo = useCallback((id) => {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
    }, [])

    return (
        <main className="app">
            <h1>Список задач (Rect.memo)</h1>

            <form className="todo-form" onSubmit={addTodo}>
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Новая задача"
                />
                <button type="submit">Добавить</button>
            </form>

            <ul className="todo-list">
                {todos.map((todo) => (
                    <TodoItem
                        key={todo.id}
                        id={todo.id}
                        text={todo.text}
                        completed={todo.completed}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                    />
                ))}
            </ul>
        </main>
    )
}

export default App