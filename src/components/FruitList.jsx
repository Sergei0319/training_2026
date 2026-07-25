function FruitList ({fruits}) {
    return (
        <ul>
            {fruits.map((fruit) => (
                <li key={fruit}>{fruit}</li>
            ))}
        </ul>
    )
}

export default FruitList