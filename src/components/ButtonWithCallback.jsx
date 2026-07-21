function ButtonWithCallback({ onButtonClick}) {
    const handleClick = () => {
        onButtonClick('Кнопка была нажата!')
    }
    return (
        <>
            <p style={{ marginBottom: '16px', fontSize: '26px' }}>
                Домашние задание: Передача callback через props
            </p>
            <button onClick={handleClick}
                style={{
                    padding: '14px 28px',
                    fontSize: '18px',
                    fontWeight: '600',
                }}>
            Нажми меня
            </button>
        </>

    )
}
export default ButtonWithCallback