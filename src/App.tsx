import '@fontsource-variable/inter'
import { ArrowLeftIcon, BookmarkFillIcon, ChevronDownIcon, HeartFillIcon } from '@primer/octicons-react'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { CSSProperties, useEffect, useState } from 'react'
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Dropdown from './components/Dropdown'
import './components/MediaList.css'
import Sidenav from './components/Sidenav'
import { AlbumIcon, ArtistsIcon, PlaylistIcon, TracksIcon } from './components/SvgIcons'
import { useDropdownContext } from './context/DropdownContext/DropdownContext'
import { DropdownContextProvider } from './context/DropdownContext/DropdownContextProvider'
import { useHistoryContext } from './context/HistoryContext/HistoryContext'
import { HistoryContextProvider } from './context/HistoryContext/HistoryContextProvider'
import { JellyfinContextProvider } from './context/JellyfinContext/JellyfinContextProvider'
import { usePageTitle } from './context/PageTitleContext/PageTitleContext'
import { PageTitleProvider } from './context/PageTitleContext/PageTitleProvider'
import { usePlaybackContext } from './context/PlaybackContext/PlaybackContext'
import { PlaybackContextProvider } from './context/PlaybackContext/PlaybackContextProvider'
import { ScrollContextProvider } from './context/ScrollContext/ScrollContextProvider'
import { ThemeContextProvider } from './context/ThemeContext/ThemeContextProvider'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useSidenav } from './hooks/useSidenav'
import Album from './pages/Album'
import Albums from './pages/Albums'
import Artist from './pages/Artist'
import ArtistTracks from './pages/ArtistTracks'
import Favorites from './pages/Favorites'
import FrequentlyPlayed from './pages/FrequentlyPlayed'
import Genre from './pages/Genre'
import Home from './pages/Home'
import Login from './pages/Login'
import Playlist from './pages/Playlist'
import Queue from './pages/Queue'
import RecentlyPlayed from './pages/RecentlyPlayed'
import SearchResults from './pages/SearchResults'
import Settings from './pages/Settings'
import Tracks from './pages/Tracks'
import { getPageTitle } from './utils/titleUtils'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
})

const persister = createSyncStoragePersister({
    storage: window.localStorage,
})

const useAppBack = () => {
    const { goBack } = useHistoryContext()
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

    useEffect(() => {
        const isWindows = /Win/.test(navigator.userAgent)
        const isChromium = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        const isEdge = /Edg/.test(navigator.userAgent) && /Microsoft Corporation/.test(navigator.vendor)
        if (isWindows && (isChromium || isEdge)) {
            document.getElementsByTagName('html')[0].classList.add('winOS')
        } else {
            document.getElementsByTagName('html')[0].classList.add('otherOS')
        }
    }, [])

    const actualApp = (
        <div className="music-app">
            <Routes>
                <Route path="/login" element={auth ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
                <Route
                    path="/*"
                    element={
                        auth ? (
                            <JellyfinContextProvider auth={auth}>
                                <DropdownContextProvider>
                                    <PlaybackContextProvider initialVolume={0.5} clearOnLogout={isLoggingOut}>
                                        <MainLayout auth={auth} handleLogout={handleLogout} />
                                        <Dropdown />
                                    </PlaybackContextProvider>
                                </DropdownContextProvider>
                            </JellyfinContextProvider>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
            </Routes>
        </div>
    )

    const routedApp = (
        <Router basename={import.meta.env.BASE_URL}>
            <HistoryContextProvider>
                <PageTitleProvider>
                    <ScrollContextProvider>
                        <ThemeContextProvider>{actualApp}</ThemeContextProvider>
                    </ScrollContextProvider>
                </PageTitleProvider>
            </HistoryContextProvider>
        </Router>
    )

    return (
        <>
            {window.__NPM_LIFECYCLE_EVENT__ === 'dev:nocache' ? (
                <QueryClientProvider client={queryClient}>{routedApp}</QueryClientProvider>
            ) : (
                <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
                    {routedApp}
                </PersistQueryClientProvider>
            )}
        </>
    )
}

interface AuthData {
    serverUrl: string
    token: string
    userId: string
    username: string
}

const MainLayout = ({ auth, handleLogout }: { auth: AuthData; handleLogout: () => void }) => {
    useDocumentTitle()

    const playback = usePlaybackContext()
    const location = useLocation()
    const { showSidenav, toggleSidenav, closeSidenav } = useSidenav(location)
    const { pageTitle } = usePageTitle()
    const dropdownContext = useDropdownContext()
    const isDropdownOpen = dropdownContext?.isOpen || false
    const isTouchDevice = dropdownContext?.isTouchDevice || false

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    const previousPage = useAppBack()

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        playback.updateSort(event.target.value)
    }

    return (
        <div className="interface">
            <div
                className={showSidenav || (isDropdownOpen && isTouchDevice) ? 'dimmer active' : 'dimmer'}
                onClick={showSidenav ? toggleSidenav : dropdownContext?.closeDropdown}
            ></div>
            <Sidenav username={auth.username} showSidenav={showSidenav} closeSidenav={closeSidenav} />
            <main className="main">
                <div className="main_header">
                    <div className="primary">
                        <div onClick={previousPage} className="return_icon">
                            <ArrowLeftIcon size={16}></ArrowLeftIcon>
                        </div>
                        <div className="container">
                            <div className="page_title">
                                <div className="text" title={getPageTitle(pageTitle, location)}>
                                    {getPageTitle(pageTitle, location)}
                                </div>
                                {location.pathname.startsWith('/album/') && pageTitle && (
                                    <div className="page-icon album" title="Album">
                                        <AlbumIcon width={16} height={16} />
                                    </div>
                                )}
                                {pageTitle &&
                                    (location.pathname.match(/^\/artist\/[^/]+\/tracks$/) ? (
                                        <div className="page-icon artist-tracks" title="Tracks">
                                            <TracksIcon width={12} height={12} />
                                        </div>
                                    ) : location.pathname.startsWith('/artist/') ? (
                                        <div className="page-icon artist" title="Artist">
                                            <ArtistsIcon width={16} height={16} />
                                        </div>
                                    ) : null)}
                                {location.pathname.startsWith('/genre/') && pageTitle && (
                                    <div className="page-icon genre" title="Genre">
                                        <BookmarkFillIcon size={16} />
                                    </div>
                                )}
                                {location.pathname.startsWith('/playlist/') && pageTitle && (
                                    <div className="page-icon playlist" title="Playlist">
                                        <PlaylistIcon width={12} height={12} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="secondary">
                        {location.pathname === '/tracks' && (
                            <div className="filter">
                                <select onChange={handleSortChange} defaultValue="Added">
                                    <option value="Added">Added</option>
                                    <option value="Released">Released</option>
                                    <option value="Runtime">Runtime</option>
                                    <option value="Random">Random</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        )}
                        {location.pathname === '/albums' && (
                            <div className="filter">
                                <select onChange={handleSortChange} defaultValue="Added">
                                    <option value="Added">Added</option>
                                    <option value="Released">Released</option>
                                    <option value="Runtime">Runtime</option>
                                    <option value="Random">Random</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        )}
                        {location.pathname === '/favorites' && (
                            <div className="filter">
                                <select onChange={handleSortChange} defaultValue="Tracks">
                                    <option value="Tracks">Tracks</option>
                                    <option value="Albums">Albums</option>
                                    <option value="Artists">Artists</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        )}
                        {location.pathname.startsWith('/genre') && (
                            <div className="filter">
                                <select onChange={handleSortChange} defaultValue="Added">
                                    <option value="Added">Added</option>
                                    <option value="Released">Released</option>
                                    <option value="Runtime">Runtime</option>
                                    <option value="Random">Random</option>
                                </select>
                                <div className="icon">
                                    <ChevronDownIcon size={12} />
                                </div>
                            </div>
                        )}
                        <div className="sidenav_toggle noSelect" onClick={toggleSidenav}>
                            <div className="bar"></div>
                            <div className="bar"></div>
                        </div>
                    </div>
                </div>
                <div className="main_content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/tracks" element={<Tracks />} />
                        <Route path="/albums" element={<Albums />} />
                        <Route path="/album/:albumId" element={<Album />} />
                        <Route path="/artist/:artistId" element={<Artist />} />
                        <Route path="/artist/:artistId/tracks" element={<ArtistTracks />} />
                        <Route path="/genre/:genre" element={<Genre />} />
                        <Route path="/playlist/:playlistId" element={<Playlist key={window.location.pathname} />} />
                        <Route path="/queue" element={<Queue />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/recently" element={<RecentlyPlayed />} />
                        <Route path="/frequently" element={<FrequentlyPlayed />} />
                        <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                        <Route path="/search/:query" element={<SearchResults />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
                <div className="main_footer">
                    <div
                        className={
                            playback.isPlaying
                                ? 'playback playing'
                                : playback.currentTrack
                                ? 'playback paused'
                                : 'playback'
                        }
                    >
                        <div className="progress">
                            <input
                                type="range"
                                id="track-progress"
                                name="track-progress"
                                min="0"
                                max={playback.duration || 1}
                                step="0.01"
                                value={playback.progress}
                                style={
                                    {
                                        '--progress-width': `${
                                            playback.duration ? (playback.progress / playback.duration) * 100 : 0
                                        }%`,
                                        '--buffered-width': `${
                                            playback.duration ? (playback.buffered / playback.duration) * 100 : 0
                                        }%`,
                                    } as CSSProperties
                                }
                                onChange={playback.handleSeek}
                            />
                        </div>
                        <div className="container">
                            <div className="track-info">
                                <div className="track-name">
                                    <div className="text" title={playback.currentTrack?.Name || 'No Track Played'}>
                                        {playback.currentTrack?.Name ? (
                                            <Link to="/queue">{playback.currentTrack.Name}</Link>
                                        ) : (
                                            'No Track Played'
                                        )}
                                    </div>
                                    {playback.currentTrack?.UserData?.IsFavorite && (
                                        <span className="favorited" title="Favorited">
                                            <HeartFillIcon size={12}></HeartFillIcon>
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="artist"
                                    title={
                                        playback.currentTrack?.Artists?.join(', ') ||
                                        playback.currentTrack?.AlbumArtist ||
                                        'No Artist'
                                    }
                                >
                                    {playback.currentTrack &&
                                    playback.currentTrack.ArtistItems &&
                                    playback.currentTrack.ArtistItems.length > 0
                                        ? (() => {
                                              const artistItems = playback.currentTrack.ArtistItems
                                              return artistItems.map((artist, index) => (
                                                  <span key={artist.Id}>
                                                      <Link to={`/artist/${artist.Id}`} className="text">
                                                          {artist.Name}
                                                      </Link>
                                                      {index < artistItems.length - 1 && ', '}
                                                  </span>
                                              ))
                                          })()
                                        : playback.currentTrack?.Artists?.join(', ') ||
                                          playback.currentTrack?.AlbumArtist ||
                                          'No Artist'}
                                </div>
                                <div className="album">
                                    {playback.currentTrack?.Album ? (
                                        <Link
                                            to={`/album/${playback.currentTrack.AlbumId}`}
                                            className="text"
                                            title={playback.currentTrack.Album}
                                        >
                                            {playback.currentTrack.Album}
                                        </Link>
                                    ) : (
                                        <div className="text">No Album</div>
                                    )}
                                    <div className="album-icon" title="Album">
                                        <AlbumIcon width={12} height={12} />
                                    </div>
                                </div>
                            </div>
                            <div className="controls">
                                <div className="knobs">
                                    <div
                                        className={`shuffle ${playback.shuffle ? 'active' : ''}`}
                                        onClick={playback.toggleShuffle}
                                    >
                                        <div className="shuffle-icon"></div>
                                    </div>
                                    <div className="primary">
                                        <div className="previous" onClick={playback.previousTrack}>
                                            <div className="previous-icon"></div>
                                        </div>
                                        <div className="container">
                                            <div className="play" onClick={playback.togglePlayPause}>
                                                <div className="play-icon"></div>
                                            </div>
                                            <div className="pause" onClick={playback.togglePlayPause}>
                                                <div className="pause-icon"></div>
                                            </div>
                                        </div>
                                        <div className="next" onClick={playback.nextTrack}>
                                            <div className="next-icon"></div>
                                        </div>
                                    </div>
                                    <div
                                        className={`repeat ${playback.repeat === 'off' ? '' : 'active'}`}
                                        onClick={playback.toggleRepeat}
                                    >
                                        <div className={`repeat-icon${playback.repeat === 'one' ? '-one' : ''}`}></div>
                                    </div>
                                </div>
                                <div className="duration noSelect">
                                    <div className="current">{playback.formatTime(playback.progress)}</div>
                                    <div className="divider">/</div>
                                    <div className="total">{playback.formatTime(playback.duration)}</div>
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
