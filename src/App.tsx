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
                        <Link to={-1} className="return_icon">
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
                        Playback area, current song title, artist, from which album - playlist
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
