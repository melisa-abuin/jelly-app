import '@fontsource-variable/inter'
import { ArrowLeftIcon, BookmarkFillIcon, HeartFillIcon } from '@primer/octicons-react'
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
import Artist from './pages/Artist'
import Favorites from './pages/Favorites'
import FrequentlyPlayed from './pages/FrequentlyPlayed'
import Genre from './pages/Genre'
import Home from './pages/Home'
import Login from './pages/Login'
import Playlist from './pages/Playlist'
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

    const validRoutes = [
        '/',
        '/tracks',
        '/albums',
        '/favorites',
        '/settings',
        '/album',
        '/recently',
        '/frequently',
        '/artist',
        '/genre',
        '/playlist',
    ]

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
        if (location.pathname.startsWith('/artist/')) {
            return pageTitle || 'Artist'
        }
        if (location.pathname.startsWith('/genre/')) {
            return pageTitle || 'Genre'
        }
        if (location.pathname.startsWith('/playlist/')) {
            return pageTitle || 'Playlist'
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
                                                <div className="page-icon album" title="Album">
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
                                            {location.pathname.startsWith('/artist/') && pageTitle && (
                                                <div className="page-icon artist" title="Artist">
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 22 22"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M10.9912 19.7422C15.9746 19.7422 20.0879 15.6289 20.0879 10.6543C20.0879 5.67969 15.9658 1.56641 10.9824 1.56641C6.00781 1.56641 1.90332 5.67969 1.90332 10.6543C1.90332 15.6289 6.0166 19.7422 10.9912 19.7422ZM10.9912 13.6953C8.5127 13.6953 6.58789 14.583 5.65625 15.6025C4.46094 14.3105 3.73145 12.5703 3.73145 10.6543C3.73145 6.62012 6.95703 3.38574 10.9824 3.38574C15.0166 3.38574 18.2598 6.62012 18.2686 10.6543C18.2686 12.5703 17.5391 14.3105 16.335 15.6113C15.4033 14.583 13.4785 13.6953 10.9912 13.6953ZM10.9912 12.2539C12.6963 12.2715 14.0234 10.8125 14.0234 8.93164C14.0234 7.15625 12.6875 5.6709 10.9912 5.6709C9.30371 5.6709 7.95898 7.15625 7.96777 8.93164C7.97656 10.8125 9.29492 12.2451 10.9912 12.2539Z" />
                                                    </svg>
                                                </div>
                                            )}

                                            {location.pathname.startsWith('/genre/') && pageTitle && (
                                                <div className="page-icon genre" title="Genre">
                                                    <BookmarkFillIcon size={16} />
                                                </div>
                                            )}
                                            {location.pathname.startsWith('/playlist/') && pageTitle && (
                                                <div className="page-icon playlist" title="Playlist">
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 52 54"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M 41.83984375,16.7578125 L 41.83984375,9.302734375 C 41.83984375,8.099609375 40.89453125,7.3046875 39.712890625,7.5625 L 28.390625,9.990234375 C 27.015625,10.291015625 26.328125,10.978515625 26.328125,12.1171875 L 26.478515625,34.9765625 C 26.478515625,36.05078125 25.94140625,36.759765625 24.99609375,36.953125 L 21.623046875,37.662109375 C 17.43359375,38.54296875 15.478515625,40.6484375 15.478515625,43.806640625 C 15.478515625,46.986328125 17.90625,49.19921875 21.365234375,49.19921875 C 24.458984375,49.19921875 29.03515625,46.96484375 29.03515625,40.86328125 L 29.03515625,22.193359375 C 29.03515625,21.033203125 29.271484375,20.796875 30.32421875,20.5390625 L 40.59375,18.283203125 C 41.3671875,18.1328125 41.83984375,17.53125 41.83984375,16.7578125 Z" />
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
                                        path="/artist/:artistId"
                                        element={
                                            <Artist
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
                                        path="/genre/:genre"
                                        element={
                                            <Genre
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
                                        path="/playlist/:playlistId"
                                        element={
                                            <Playlist
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
                                                {currentTrack &&
                                                currentTrack.ArtistItems &&
                                                currentTrack.ArtistItems.length > 0
                                                    ? (() => {
                                                          const artistItems = currentTrack.ArtistItems
                                                          return artistItems.map((artist, index) => (
                                                              <span key={artist.Id}>
                                                                  <Link to={`/artist/${artist.Id}`} className="text">
                                                                      {artist.Name}
                                                                  </Link>
                                                                  {index < artistItems.length - 1 && ', '}
                                                              </span>
                                                          ))
                                                      })()
                                                    : currentTrack?.Artists?.join(', ') ||
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
