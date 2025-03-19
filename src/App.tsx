import { ArrowLeftIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import { MediaItem } from './api/jellyfin'
import './App.css'
import './components/MediaList.css'
import PlaybackManager from './components/PlaybackManager'
import Sidenav from './components/Sidenav'
import { useSidenav } from './hooks/useSidenav'
import Albums from './pages/Albums'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Tracks from './pages/Tracks'

interface AuthData {
    serverUrl: string
    token: string
    userId: string
    username: string
    lastPlayedTrack?: MediaItem | null
    volume?: number
}

const App = () => {
    const [auth, setAuth] = useState<AuthData | null>(() => {
        const savedAuth = localStorage.getItem('auth')
        const parsedAuth = savedAuth ? JSON.parse(savedAuth) : null
        const defaultVolume = 0.5
        return parsedAuth
            ? {
                  ...parsedAuth,
                  volume:
                      parsedAuth.volume !== undefined && !isNaN(parsedAuth.volume) ? parsedAuth.volume : defaultVolume,
              }
            : null
    })

    const handleLogin = (authData: AuthData) => {
        const defaultVolume = 0.5
        const updatedAuth = {
            ...authData,
            volume: authData.volume !== undefined && !isNaN(authData.volume) ? authData.volume : defaultVolume,
        }
        setAuth(updatedAuth)
        localStorage.setItem('auth', JSON.stringify(updatedAuth))
    }

    const handleLogout = () => {
        setAuth(null)
        localStorage.removeItem('auth')
    }

    const updateLastPlayed = (track: MediaItem) => {
        if (auth) {
            const updatedAuth = { ...auth, lastPlayedTrack: track }
            setAuth(updatedAuth)
            localStorage.setItem('auth', JSON.stringify(updatedAuth))
        }
    }

    const updateVolume = (volume: number) => {
        if (auth) {
            const validatedVolume = Math.max(0, Math.min(1, volume))
            const updatedAuth = { ...auth, volume: validatedVolume }
            setAuth(updatedAuth)
            localStorage.setItem('auth', JSON.stringify(updatedAuth))
        }
    }

    useEffect(() => {
        if (!auth) {
            localStorage.removeItem('auth')
        } else if (auth.volume === undefined || isNaN(auth.volume)) {
            updateVolume(auth.volume === 0 ? 0 : 0.5)
        }
    }, [auth])

    return (
        <Router>
            <div className="music-app">
                <Routes>
                    <Route path="/login" element={auth ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
                    <Route
                        path="/*"
                        element={
                            auth ? (
                                <PlaybackManager
                                    serverUrl={auth.serverUrl}
                                    token={auth.token}
                                    userId={auth.userId}
                                    initialVolume={auth.volume || 0.5}
                                    updateLastPlayed={updateLastPlayed}
                                >
                                    {({
                                        currentTrack,
                                        isPlaying,
                                        togglePlayPause,
                                        progress,
                                        duration,
                                        buffered,
                                        handleSeek,
                                        formatTime,
                                        volume,
                                        setVolume: internalSetVolume,
                                        playTrack,
                                    }) => {
                                        useEffect(() => {
                                            if (auth?.volume !== undefined && auth.volume !== volume) {
                                                internalSetVolume(auth.volume)
                                            }
                                        }, [auth?.volume])

                                        return (
                                            <MainLayout
                                                auth={auth}
                                                handleLogout={handleLogout}
                                                currentTrack={currentTrack ?? auth.lastPlayedTrack ?? null}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                progress={progress}
                                                duration={duration}
                                                buffered={buffered}
                                                handleSeek={handleSeek}
                                                formatTime={formatTime}
                                                volume={auth.volume || volume}
                                                setVolume={newVolume => {
                                                    updateVolume(newVolume)
                                                    internalSetVolume(newVolume)
                                                }}
                                                playTrack={playTrack}
                                            />
                                        )
                                    }}
                                </PlaybackManager>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                </Routes>
            </div>
        </Router>
    )
}

const MainLayout = ({
    auth,
    handleLogout,
    currentTrack,
    isPlaying,
    togglePlayPause,
    progress,
    duration,
    buffered,
    handleSeek,
    formatTime,
    volume,
    setVolume,
    playTrack,
}: {
    auth: AuthData
    handleLogout: () => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
    progress: number
    duration: number
    buffered: number
    handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
    formatTime: (seconds: number) => string
    volume: number
    setVolume: (volume: number) => void
    playTrack: (track: MediaItem) => void
}) => {
    const location = useLocation()
    const { showSidenav, toggleSidenav, closeSidenav } = useSidenav(location)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Home'
            case '/tracks':
                return 'Tracks'
            case '/albums':
                return 'Albums'
            case '/favorites':
                return 'Favorites'
            case '/settings':
                return 'Settings'
            default:
                return 'Home'
        }
    }

    const progressPercent = duration ? (progress / duration) * 100 : 0
    const bufferedPercent = duration ? (buffered / duration) * 100 : 0

    return (
        <div className="interface">
            <Sidenav
                username={auth.username}
                showSidenav={showSidenav}
                closeSidenav={closeSidenav}
                volume={volume}
                setVolume={setVolume}
            />
            <div className={showSidenav ? 'dimmer active' : 'dimmer'} onClick={toggleSidenav}></div>
            <main className="main">
                <div className="main_header">
                    <div className="primary">
                        <Link to="-1" className="return_icon">
                            <ArrowLeftIcon size={16}></ArrowLeftIcon>
                        </Link>
                        <div className="container">
                            <div className="page_title">{getPageTitle()}</div>
                        </div>
                    </div>
                    <div className="secondary">
                        <div className="sidenav_toggle noSelect" onClick={toggleSidenav}>
                            <div className="bar"></div>
                            <div className="bar"></div>
                        </div>
                    </div>
                </div>
                <div className="main_content">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Home
                                    user={{ userId: auth.userId, username: auth.username }}
                                    serverUrl={auth.serverUrl}
                                    token={auth.token}
                                    playTrack={playTrack}
                                    currentTrack={currentTrack}
                                    isPlaying={isPlaying}
                                    togglePlayPause={togglePlayPause}
                                />
                            }
                        />
                        <Route
                            path="/tracks"
                            element={
                                <Tracks
                                    user={{ userId: auth.userId, username: auth.username }}
                                    serverUrl={auth.serverUrl}
                                    token={auth.token}
                                    playTrack={playTrack}
                                    currentTrack={currentTrack}
                                    isPlaying={isPlaying}
                                    togglePlayPause={togglePlayPause}
                                />
                            }
                        />
                        <Route
                            path="/albums"
                            element={
                                <Albums
                                    user={{ userId: auth.userId, username: auth.username }}
                                    serverUrl={auth.serverUrl}
                                    token={auth.token}
                                />
                            }
                        />
                        <Route
                            path="/favorites"
                            element={
                                <Favorites
                                    user={{ userId: auth.userId, username: auth.username }}
                                    serverUrl={auth.serverUrl}
                                    token={auth.token}
                                    playTrack={playTrack}
                                    currentTrack={currentTrack}
                                    isPlaying={isPlaying}
                                    togglePlayPause={togglePlayPause}
                                />
                            }
                        />
                        <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
                <div className="main_footer">
                    <div className={isPlaying ? 'playback playing' : currentTrack ? 'playback paused' : 'playback'}>
                        <div className="progress">
                            <input
                                type="range"
                                id="track-progress"
                                name="track-progress"
                                min="0"
                                max={duration || 1}
                                step="0.01"
                                value={progress}
                                style={
                                    {
                                        '--progress-width': `${progressPercent}%`,
                                        '--buffered-width': `${bufferedPercent}%`,
                                    } as React.CSSProperties
                                }
                                onChange={handleSeek}
                            />
                        </div>
                        <div className="container">
                            <div className="track-info">
                                <div className="track-name">
                                    {currentTrack?.Name || auth?.lastPlayedTrack?.Name || 'No Track Played'}
                                </div>
                                <div className="artist">
                                    {currentTrack?.Artists?.join(', ') ||
                                        currentTrack?.AlbumArtist ||
                                        auth?.lastPlayedTrack?.Artists?.join(', ') ||
                                        auth?.lastPlayedTrack?.AlbumArtist ||
                                        'No Artist'}
                                </div>
                                <div className="album">
                                    <div className="text">
                                        {currentTrack?.Album || auth?.lastPlayedTrack?.Album || 'No Album'}
                                    </div>
                                    <div className="album-icon">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 22 22"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M10.9912 19.7422C15.9746 19.7422 20.0879 15.6289 20.0879 10.6543C20.0879 5.67969 15.9658 1.56641 10.9824 1.56641C6.00781 1.56641 1.90332 5.67969 1.90332 10.6543C1.90332 15.6289 6.0166 19.7422 10.9912 19.7422ZM11 14.0996C12.9072 14.0996 14.4453 12.5615 14.4453 10.6455C14.4453 8.74707 12.9072 7.2002 11 7.2002C9.08398 7.2002 7.5459 8.74707 7.5459 10.6455C7.5459 12.5615 9.08398 14.0996 11 14.0996Z"
                                                className="record"
                                            />
                                            <circle className="spindle-hole" cx="11" cy="10.6455" r="1.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="controls">
                                <div className="knobs">
                                    <div className="shuffle">
                                        <div className="shuffle-icon"></div>
                                    </div>
                                    <div className="primary">
                                        <div className="previous">
                                            <div className="previous-icon"></div>
                                        </div>
                                        <div className="container">
                                            <div className="play" onClick={togglePlayPause}>
                                                <div className="play-icon"></div>
                                            </div>
                                            <div className="pause" onClick={togglePlayPause}>
                                                <div className="pause-icon"></div>
                                            </div>
                                        </div>
                                        <div className="next">
                                            <div className="next-icon"></div>
                                        </div>
                                    </div>
                                    <div className="repeat">
                                        <div className="repeat-icon"></div>
                                    </div>
                                </div>
                                <div className="duration noSelect">
                                    <div className="current">{formatTime(progress)}</div>
                                    <div className="divider">/</div>
                                    <div className="total">{formatTime(duration)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default App
