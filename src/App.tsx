import '@fontsource-variable/inter'
import { ArrowLeftIcon, HeartFillIcon } from '@primer/octicons-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom'
import { MediaItem } from './api/jellyfin'
import './App.css'
import './components/MediaList.css'
import PlaybackManager from './components/PlaybackManager'
import Sidenav from './components/Sidenav'
import { useSidenav } from './hooks/useSidenav'
import Album from './pages/Album'
import Albums from './pages/Albums'
import Favorites from './pages/Favorites'
import FrequentlyPlayed from './pages/FrequentlyPlayed'
import Home from './pages/Home'
import Login from './pages/Login'
import RecentlyPlayed from './pages/RecentlyPlayed'
import Settings from './pages/Settings'
import Tracks from './pages/Tracks'

// Create a context for the page title
interface PageTitleContextType {
    pageTitle: string
    setPageTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState<string>('')

    return <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>{children}</PageTitleContext.Provider>
}

export const usePageTitle = () => {
    const context = useContext(PageTitleContext)
    if (!context) {
        throw new Error('usePageTitle must be used within a PageTitleProvider')
    }
    return context
}

interface AuthData {
    serverUrl: string
    token: string
    userId: string
    username: string
}

interface HistoryContextType {
    historyStack: string[]
    goBack: () => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [historyStack, setHistoryStack] = useState<string[]>([])
    const navigate = useNavigate()
    const location = useLocation()
    const prevLocationRef = useRef<string | null>(null)

    const validRoutes = ['/', '/tracks', '/albums', '/favorites', '/settings', '/album', '/recently', '/frequently']

    useEffect(() => {
        const currentPath = location.pathname

        if (
            validRoutes.some(route => currentPath === route || currentPath.startsWith(route + '/')) &&
            currentPath !== prevLocationRef.current
        ) {
            setHistoryStack(prev => {
                if (prev[prev.length - 1] === currentPath) {
                    return prev
                }
                return [...prev, currentPath]
            })
            prevLocationRef.current = currentPath
        }
    }, [location.pathname])

    const goBack = () => {
        if (historyStack.length > 1) {
            setHistoryStack(prev => {
                const newStack = prev.slice(0, -1)
                const previousRoute = newStack[newStack.length - 1]
                navigate(previousRoute)
                return newStack
            })
        } else {
            navigate('/')
        }
    }

    return <HistoryContext.Provider value={{ historyStack, goBack }}>{children}</HistoryContext.Provider>
}

const useAppBack = () => {
    const { goBack } = useContext(HistoryContext)!
    return goBack
}

const App = () => {
    const [auth, setAuth] = useState<AuthData | null>(() => {
        const savedAuth = localStorage.getItem('auth')
        return savedAuth ? JSON.parse(savedAuth) : null
    })
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogin = (authData: AuthData) => {
        setAuth(authData)
        localStorage.setItem('auth', JSON.stringify(authData))
    }

    const handleLogout = () => {
        setIsLoggingOut(true)
        localStorage.removeItem('repeatMode')
        setAuth(null)
        localStorage.removeItem('auth')
        setIsLoggingOut(false)
    }

    useEffect(() => {
        if (!auth) {
            localStorage.removeItem('auth')
        }
    }, [auth])

    return (
        <Router>
            <HistoryProvider>
                <PageTitleProvider>
                    <div className="music-app">
                        <Routes>
                            <Route
                                path="/login"
                                element={auth ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
                            />
                            <Route
                                path="/*"
                                element={
                                    auth ? (
                                        <MainLayout
                                            auth={auth}
                                            handleLogout={handleLogout}
                                            isLoggingOut={isLoggingOut}
                                        />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                        </Routes>
                    </div>
                </PageTitleProvider>
            </HistoryProvider>
        </Router>
    )
}

const MainLayout = ({
    auth,
    handleLogout,
    isLoggingOut,
}: {
    auth: AuthData
    handleLogout: () => void
    isLoggingOut: boolean
}) => {
    const location = useLocation()
    const { showSidenav, toggleSidenav, closeSidenav } = useSidenav(location)
    const [currentPlaylist, setCurrentPlaylist] = useState<MediaItem[]>(() => {
        const savedPlaylist = localStorage.getItem('currentPlaylist')
        return savedPlaylist ? JSON.parse(savedPlaylist) : []
    })
    const [loadMoreCallback, setLoadMoreCallback] = useState<(() => void) | undefined>(undefined)
    const [hasMoreState, setHasMoreState] = useState<boolean>(false)
    const { pageTitle } = usePageTitle()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    useEffect(() => {
        localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist))
    }, [currentPlaylist])

    const handleSetCurrentPlaylist = (newPlaylist: MediaItem[]) => {
        setCurrentPlaylist(newPlaylist)
    }

    const getPageTitle = () => {
        if (location.pathname.startsWith('/album/')) {
            return pageTitle || 'Album'
        }
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
            case '/recently':
                return 'Recently Played'
            case '/frequently':
                return 'Frequently Played'
            default:
                return 'Home'
        }
    }

    const previousPage = useAppBack()

    return (
        <div className="interface">
            <PlaybackManager
                serverUrl={auth.serverUrl}
                token={auth.token}
                userId={auth.userId}
                initialVolume={0.5}
                updateLastPlayed={(track: MediaItem) => {
                    localStorage.setItem('lastPlayedTrack', JSON.stringify(track))
                }}
                playlist={currentPlaylist}
                loadMore={loadMoreCallback}
                hasMore={hasMoreState}
                clearOnLogout={isLoggingOut}
            >
                {({
                    currentTrack,
                    currentTrackIndex,
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
                    nextTrack,
                    previousTrack,
                    shuffle,
                    toggleShuffle,
                    repeat,
                    toggleRepeat,
                }) => (
                    <>
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
                                    <div onClick={previousPage} className="return_icon">
                                        <ArrowLeftIcon size={16}></ArrowLeftIcon>
                                    </div>
                                    <div className="container">
                                        <div className="page_title">
                                            <div className="text" title={getPageTitle()}>
                                                {getPageTitle()}
                                            </div>
                                            {location.pathname.startsWith('/album/') && pageTitle && (
                                                <div className="album-icon" title="Album">
                                                    <svg
                                                        width="18"
                                                        height="18"
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
                                            )}
                                        </div>
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
                                                currentTrackIndex={currentTrackIndex}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
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
                                                currentTrackIndex={currentTrackIndex}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
                                                setLoadMoreCallback={setLoadMoreCallback}
                                                setHasMoreState={setHasMoreState}
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
                                        path="/album/:albumId"
                                        element={
                                            <Album
                                                user={{ userId: auth.userId, username: auth.username }}
                                                serverUrl={auth.serverUrl}
                                                token={auth.token}
                                                playTrack={playTrack}
                                                currentTrack={currentTrack}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
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
                                                currentTrackIndex={currentTrackIndex}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
                                                setLoadMoreCallback={setLoadMoreCallback}
                                                setHasMoreState={setHasMoreState}
                                            />
                                        }
                                    />
                                    <Route
                                        path="/recently"
                                        element={
                                            <RecentlyPlayed
                                                serverUrl={auth.serverUrl}
                                                userId={auth.userId}
                                                token={auth.token}
                                                playTrack={playTrack}
                                                currentTrack={currentTrack}
                                                currentTrackIndex={currentTrackIndex}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
                                                setLoadMoreCallback={setLoadMoreCallback}
                                                setHasMoreState={setHasMoreState}
                                            />
                                        }
                                    />
                                    <Route
                                        path="/frequently"
                                        element={
                                            <FrequentlyPlayed
                                                serverUrl={auth.serverUrl}
                                                userId={auth.userId}
                                                token={auth.token}
                                                playTrack={playTrack}
                                                currentTrack={currentTrack}
                                                currentTrackIndex={currentTrackIndex}
                                                isPlaying={isPlaying}
                                                togglePlayPause={togglePlayPause}
                                                setCurrentPlaylist={handleSetCurrentPlaylist}
                                                setLoadMoreCallback={setLoadMoreCallback}
                                                setHasMoreState={setHasMoreState}
                                            />
                                        }
                                    />
                                    <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </div>
                            <div className="main_footer">
                                <div
                                    className={
                                        isPlaying ? 'playback playing' : currentTrack ? 'playback paused' : 'playback'
                                    }
                                >
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
                                                    '--progress-width': `${
                                                        duration ? (progress / duration) * 100 : 0
                                                    }%`,
                                                    '--buffered-width': `${
                                                        duration ? (buffered / duration) * 100 : 0
                                                    }%`,
                                                } as React.CSSProperties
                                            }
                                            onChange={handleSeek}
                                        />
                                    </div>
                                    <div className="container">
                                        <div className="track-info">
                                            <div className="track-name">
                                                <div className="text" title={currentTrack?.Name || 'No Track Played'}>
                                                    {currentTrack?.Name || 'No Track Played'}
                                                </div>
                                                {currentTrack?.UserData?.IsFavorite && (
                                                    <span className="favorited" title="Favorited">
                                                        <HeartFillIcon size={12}></HeartFillIcon>
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="artist"
                                                title={
                                                    currentTrack?.Artists?.join(', ') ||
                                                    currentTrack?.AlbumArtist ||
                                                    'No Artist'
                                                }
                                            >
                                                {currentTrack?.Artists?.join(', ') ||
                                                    currentTrack?.AlbumArtist ||
                                                    'No Artist'}
                                            </div>
                                            <div className="album">
                                                <Link
                                                    to={`/album/${currentTrack?.AlbumId}`}
                                                    className="text"
                                                    title={currentTrack?.Album || 'No Album'}
                                                >
                                                    {currentTrack?.Album || 'No Album'}
                                                </Link>
                                                <div className="album-icon" title="Album">
                                                    <svg
                                                        width="14"
                                                        height="14"
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
                                                <div
                                                    className={`shuffle ${shuffle ? 'active' : ''}`}
                                                    onClick={toggleShuffle}
                                                >
                                                    <div className="shuffle-icon"></div>
                                                </div>
                                                <div className="primary">
                                                    <div className="previous" onClick={previousTrack}>
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
                                                    <div className="next" onClick={nextTrack}>
                                                        <div className="next-icon"></div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`repeat ${repeat === 'off' ? '' : 'active'}`}
                                                    onClick={toggleRepeat}
                                                >
                                                    <div
                                                        className={`repeat-icon${repeat === 'one' ? '-one' : ''}`}
                                                    ></div>
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
                    </>
                )}
            </PlaybackManager>
        </div>
    )
}

export default App
