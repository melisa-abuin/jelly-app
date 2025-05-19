import '@fontsource-variable/inter'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import { Dropdown } from './components/Dropdown'
import { Main } from './components/Main'
import './components/MediaList.css'
import { Sidenav } from './components/Sidenav'
import { useDropdownContext } from './context/DropdownContext/DropdownContext'
import { DropdownContextProvider } from './context/DropdownContext/DropdownContextProvider'
import { HistoryContextProvider } from './context/HistoryContext/HistoryContextProvider'
import { JellyfinContextProvider } from './context/JellyfinContext/JellyfinContextProvider'
import { PageTitleProvider } from './context/PageTitleContext/PageTitleProvider'
import { PlaybackContextProvider } from './context/PlaybackContext/PlaybackContextProvider'
import { ScrollContextProvider } from './context/ScrollContext/ScrollContextProvider'
import { useSidenavContext } from './context/SidenavContext/SidenavContext'
import { SidenavContextProvider } from './context/SidenavContext/SidenavContextProvider'
import { ThemeContextProvider } from './context/ThemeContext/ThemeContextProvider'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { Album } from './pages/Album'
import { Albums } from './pages/Albums'
import { Artist } from './pages/Artist'
import { ArtistTracks } from './pages/ArtistTracks'
import { Favorites } from './pages/Favorites'
import { FrequentlyPlayed } from './pages/FrequentlyPlayed'
import { Genre } from './pages/Genre'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Playlist } from './pages/Playlist'
import { Queue } from './pages/Queue'
import { RecentlyPlayed } from './pages/RecentlyPlayed'
import { SearchResults } from './pages/SearchResults'
import { Settings } from './pages/Settings'
import { Tracks } from './pages/Tracks'

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

export const App = () => {
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
                                        <SidenavContextProvider>
                                            <MainLayout auth={auth} handleLogout={handleLogout} />
                                        </SidenavContextProvider>
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

    const { showSidenav, toggleSidenav } = useSidenavContext()
    const dropdownContext = useDropdownContext()
    const isDropdownOpen = dropdownContext?.isOpen || false
    const isTouchDevice = dropdownContext?.isTouchDevice || false

    return (
        <div className="interface">
            <div
                className={showSidenav || (isDropdownOpen && isTouchDevice) ? 'dimmer active' : 'dimmer'}
                onClick={showSidenav ? toggleSidenav : dropdownContext?.closeDropdown}
            />

            <Sidenav username={auth.username} />

            <Routes>
                <Route path="/" element={<Main content={<Home />}></Main>} />
                <Route path="/tracks" element={<Main content={<Tracks />} filterType={'mediaItems'} />} />
                <Route
                    path="/albums"
                    element={<Main content={<Albums />} filterType={'mediaItems'} dropdownType={'album'} />}
                />
                <Route path="/album/:albumId" element={<Main content={<Album />} dropdownType={'album'} />} />
                <Route path="/artist/:artistId" element={<Main content={<Artist />} dropdownType={'artist'} />} />
                <Route
                    path="/artist/:artistId/tracks"
                    element={<Main content={<ArtistTracks />} dropdownType={'artist'} />}
                />
                <Route path="/genre/:genre" element={<Main content={<Genre />} filterType={'mediaItems'} />} />
                <Route
                    path="/playlist/:playlistId"
                    element={<Main content={<Playlist key={window.location.pathname} />} />}
                />
                <Route path="/queue" element={<Main content={<Queue />} />} />
                <Route path="/favorites" element={<Main content={<Favorites />} filterType={'favorites'} />} />
                <Route path="/recently" element={<Main content={<RecentlyPlayed />} />} />
                <Route path="/frequently" element={<Main content={<FrequentlyPlayed />} />} />
                <Route path="/settings" element={<Main content={<Settings onLogout={handleLogout} />} />} />
                <Route path="/search/:query" element={<Main content={<SearchResults />} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    )
}
