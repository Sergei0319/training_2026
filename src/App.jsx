import ButtonWithCallback from './components/ButtonWithCallback'

function App() {
    const  handleClick = (message) => {
        console.log(message)
    }
  return (
    <>

        <ButtonWithCallback onButtonClick={handleClick} />
    </>
  )
}
export default App
