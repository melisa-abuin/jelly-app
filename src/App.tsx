import { ArrowLeftIcon } from '@primer/octicons-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Sidenav from './components/Sidenav';
import Albums from './pages/Albums';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Tracks from './pages/Tracks';

interface AuthData {
    serverUrl: string;
    token: string;
    userId: string;
    username: string;
}

function App() {
    const [auth, setAuth] = useState<AuthData | null>(() => {
        const savedAuth = localStorage.getItem('auth');
        const parsedAuth = savedAuth ? JSON.parse(savedAuth) : null;
        console.log('Initial auth from localStorage:', parsedAuth);
        return parsedAuth;
    });

    const handleLogin = (authData: AuthData) => {
        console.log('Logging in with:', authData);
        setAuth(authData);
        localStorage.setItem('auth', JSON.stringify(authData));
    };

    const handleLogout = () => {
        console.log('Logging out');
        setAuth(null);
        localStorage.removeItem('auth');
    };

    useEffect(() => {
        if (!auth) localStorage.removeItem('auth');
        console.log('Current auth state:', auth);
    }, [auth]);

    const MainLayout = () => {
        const location = useLocation();

        const getPageTitle = () => {
            switch (location.pathname) {
                case '/':
                    return 'Home';
                case '/tracks':
                    return 'Tracks';
                case '/albums':
                    return 'Albums';
                case '/favorites':
                    return 'Favorites';
                case '/settings':
                    return 'Settings';
                default:
                    return 'Home';
            }
        };

        return (
            <div className="interface">
                <Sidenav username={auth!.username} onLogout={handleLogout} />
                <main className="main">
                    <div className="main_header">
                        <Link to="-1" className="return_icon">
                            <ArrowLeftIcon size={16}></ArrowLeftIcon>
                        </Link>
                        <div className="page_title">{getPageTitle()}</div>
                    </div>
                    <div className="main_content">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Home
                                        user={{ userId: auth!.userId, username: auth!.username }}
                                        serverUrl={auth!.serverUrl}
                                        token={auth!.token}
                                    />
                                }
                            />
                            <Route path="/tracks" element={<Tracks />} />
                            <Route path="/albums" element={<Albums />} />
                            <Route path="/favorites" element={<Favorites />} />
                            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                    <div className="main_footer">
                        <div className="playback">
                            <div className="progress">
                                <input
                                    type="range"
                                    id="track-progress"
                                    name="track-progress"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    defaultValue={0}
                                />
                            </div>
                            <div className="container">
                                <div className="track-info">
                                    <div className="track-name">Moon River</div>
                                    <div className="artist">Audrey Hepburn</div>
                                    <div className="album">
                                        <div className="text">Breakfast At Tiffany's</div>
                                        <div className="album-icon">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 22 22"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M10.9912 19.7422C15.9746 19.7422 20.0879 15.6289 20.0879 10.6543C20.0879 5.67969 15.9658 1.56641 10.9824 1.56641C6.00781 1.56641 1.90332 5.67969 1.90332 10.6543C1.90332 15.6289 6.0166 19.7422 10.9912 19.7422ZM11 14.0996C12.9072 14.0996 14.4453 12.5615 14.4453 10.6455C14.4453 8.74707 12.9072 7.2002 11 7.2002C9.08398 7.2002 7.5459 8.74707 7.5459 10.6455C7.5459 12.5615 9.08398 14.0996 11 14.0996Z"
                                                    fill="black"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="controls">
                                    <div className="knobs">
                                        <div className="previous"></div>
                                        <div className="play"></div>
                                        <div className="next"></div>
                                    </div>
                                    <div className="additional">
                                        <div className="shuffle"></div>
                                    </div>
                                    <div className="duration">
                                        <div className="current">0:24</div>
                                        <div className="divider">/</div>
                                        <div className="total">3:59</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    return (
        <Router>
            <div className="music-app">
                <Routes>
                    <Route path="/login" element={auth ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
                    <Route path="/*" element={auth ? <MainLayout /> : <Navigate to="/login" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
