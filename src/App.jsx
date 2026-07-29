import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import Home from './components/Home'
import About from './components/About'
import Contacts from './components/Contacts'
import './App.css'

function App() {
    return (
        <Router>
            <div className="app">
                <header className="app__header">
                    <nav className="app__nav" aria-label="Основное меню">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `app__nav-link${isActive ? ' app__nav-link--active' : ''}`
                            }
                        >
                            Главная
                        </NavLink>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `app__nav-link${isActive ? ' app__nav-link--active' : ''}`
                            }
                        >
                            О нас
                        </NavLink>
                        <NavLink
                            to="/contacts"
                            className={({ isActive }) =>
                                `app__nav-link${isActive ? ' app__nav-link--active' : ''}`
                            }
                        >
                            Контакты
                        </NavLink>
                    </nav>
                </header>

                <main className="app__main">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contacts" element={<Contacts />} />
                    </Routes>
                </main>
            </div>
        </Router>
    )
}

export default App
