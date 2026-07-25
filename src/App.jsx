import FruitList from "./components/FruitList"

function App() {
    const fruits = ['Яблоко', 'Банан', 'Апельсин', 'Киви', 'Виноград']
    return (
        <div style={{
            padding: '20px',
            fontFamily: 'sans-serif',
            backgroundColor: '#6A0DAD',
            minHeight: '100vh',
            color: 'white'
        }}>
            <h2>Домашние задание: Рендеринг списков</h2>
            <FruitList fruits={fruits} />
        </div>
    )
}
export default App