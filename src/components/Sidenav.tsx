import { GearIcon, SearchIcon, XCircleIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MediaItem, searchArtists, searchItems } from '../api/jellyfin'
import '../App.css'
import { useScrollContext } from '../context/ScrollContext'
import { useJellyfinPlaylistsList } from '../hooks/useJellyfinPlaylistsList'
import './Sidenav.css'

interface SidenavProps {
    username: string
    showSidenav: boolean
    closeSidenav: () => void
    volume: number
    setVolume: (volume: number) => void
    serverUrl: string
    userId: string
    token: string
    playTrack: (track: MediaItem, index: number) => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
}

interface SearchResult {
    type: 'Artist' | 'Album' | 'Playlist' | 'Song'
    id: string
    name: string
    artistName?: string
    mediaItem?: MediaItem
}

const Sidenav = (props: SidenavProps) => {
    const { playlists, loading, error } = useJellyfinPlaylistsList(props.serverUrl, props.userId, props.token)
    const { disabled, setDisabled } = useScrollContext()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value)
        props.setVolume(newVolume)
    }

    const handleVolumeScroll = (e: React.WheelEvent<HTMLInputElement>) => {
        e.stopPropagation()
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        const newVolume = Math.max(0, Math.min(1, props.volume + delta))
        props.setVolume(newVolume)
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            const fetchSearchResults = async () => {
                if (!searchQuery.trim() || !props.serverUrl || !props.token || !props.userId) {
                    setSearchResults([])
                    return
                }

                setSearchLoading(true)
                setSearchError(null)

                try {
                    // Fetch artists from /Artists endpoint
                    const artistResponse = await searchArtists(
                        props.serverUrl,
                        props.userId,
                        props.token,
                        searchQuery,
                        20
                    )

                    // Fetch songs, albums, and playlists from /Items endpoint
                    const itemsResponse = await searchItems(props.serverUrl, props.userId, props.token, searchQuery, 20)
                    const items = itemsResponse || []

                    const artists = artistResponse
                        .map(item => ({ type: 'Artist' as const, id: item.Id, name: item.Name }))
                        .slice(0, 4)

                    const songs = items
                        .filter(item => item.Type === 'Audio')
                        .map(item => ({
                            type: 'Song' as const,
                            id: item.Id,
                            name: item.Name,
                            artistName: item.ArtistItems?.[0]?.Name || item.Artists?.[0] || 'Unknown Artist',
                            mediaItem: item,
                        }))
                        .slice(0, 6)

                    const albums = items
                        .filter(item => item.Type === 'MusicAlbum')
                        .map(item => ({ type: 'Album' as const, id: item.Id, name: item.Name }))
                        .slice(0, 4)

                    const playlists = items
                        .filter(item => item.Type === 'Playlist')
                        .map(item => ({ type: 'Playlist' as const, id: item.Id, name: item.Name }))
                        .slice(0, 4)

                    const limitedResults = [...songs, ...artists, ...albums, ...playlists]
                    setSearchResults(limitedResults)
                } catch (err) {
                    console.error('Search Error:', err)
                    setSearchError('Failed to load search results')
                } finally {
                    setSearchLoading(false)
                }
            }

            fetchSearchResults()
        }, 400)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery, props.serverUrl, props.token, props.userId])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleClearSearch = () => {
        setSearchQuery('')
        setSearchResults([])
    }

    const handleSongClick = (song: SearchResult) => {
        if (song.mediaItem) {
            if (song.id === props.currentTrack?.Id) {
                props.togglePlayPause()
            } else {
                props.setCurrentPlaylist([song.mediaItem])
                props.playTrack(song.mediaItem, 0)
            }
            props.closeSidenav()
        }
    }

    return (
        <aside className="sidenav">
            <div className={'sidenav_wrapper' + (props.showSidenav ? ' active' : '') + (disabled ? ' lockscroll' : '')}>
                <div className="sidenav_header">
                    <div className="logo"></div>
                </div>
                <nav className="sidenav_content">
                    <ul className="links noSelect">
                        <li>
                            <NavLink to="/" onClick={props.closeSidenav}>
                                Home
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/tracks" onClick={props.closeSidenav}>
                                Tracks
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/albums" onClick={props.closeSidenav}>
                                Albums
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/favorites" onClick={props.closeSidenav}>
                                Favorites
                            </NavLink>
                        </li>
                    </ul>

                    <div className="search">
                        <div className={`input_container ${searchQuery ? 'active' : ''}`}>
                            <div className="search-icon noSelect">
                                <SearchIcon size={14} />
                            </div>
                            <input
                                type="search"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <div className="search-clear" onClick={handleClearSearch}>
                                <XCircleIcon size={14} />
                            </div>
                        </div>
                        <div className="search_results">
                            {searchQuery ? (
                                <>
                                    {searchLoading && <div className="indicator loading">Loading...</div>}
                                    {searchError && <div className="indicator error">{searchError}</div>}
                                    {!searchLoading && !searchError && searchResults.length === 0 && (
                                        <div className="empty">
                                            Search for <span className="keyword">'{searchQuery}'</span> yields no
                                            results.
                                        </div>
                                    )}
                                    {!searchLoading && !searchError && searchResults.length > 0 && (
                                        <div className="results noSelect">
                                            {searchResults.map(result =>
                                                result.type === 'Song' ? (
                                                    <div
                                                        key={`${result.type}-${result.id}`}
                                                        onClick={() => handleSongClick(result)}
                                                        className={`result ${
                                                            result.type === 'Song' &&
                                                            result.id === props.currentTrack?.Id
                                                                ? props.isPlaying
                                                                    ? 'playing'
                                                                    : 'paused'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="type song">
                                                            <div className="icon" title="Song">
                                                                <div className="song-icon">
                                                                    <svg
                                                                        width="14"
                                                                        height="14"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 9.90234 15.9277"
                                                                    >
                                                                        <g>
                                                                            <rect
                                                                                height="15.9277"
                                                                                opacity="0"
                                                                                width="9.90234"
                                                                                x="0"
                                                                                y="0"
                                                                            />
                                                                            <path d="M9.54102 3.88672L9.54102 0.966797C9.54102 0.546875 9.19922 0.263672 8.7793 0.351562L4.75586 1.23047C4.22852 1.34766 3.94531 1.62109 3.94531 2.08008L3.94531 10.6738C3.99414 11.0254 3.82812 11.25 3.51562 11.3086L2.29492 11.5625C0.732422 11.8945 0 12.6953 0 13.8867C0 15.0879 0.927734 15.9277 2.22656 15.9277C3.36914 15.9277 5.08789 15.0781 5.08789 12.8125L5.08789 5.74219C5.08789 5.35156 5.15625 5.29297 5.49805 5.22461L9.10156 4.42383C9.36523 4.36523 9.54102 4.16016 9.54102 3.88672Z" />
                                                                        </g>
                                                                    </svg>
                                                                </div>
                                                                <div className="play-icon" />
                                                                <div className="pause-icon" />
                                                                <div className="play-state-animation">
                                                                    <svg
                                                                        width="14"
                                                                        height="14"
                                                                        viewBox="0 0 14 14"
                                                                        className="sound-bars"
                                                                    >
                                                                        <rect
                                                                            x="1"
                                                                            y="8"
                                                                            width="3"
                                                                            height="6"
                                                                            rx="1.5"
                                                                            className="bar bar1"
                                                                        ></rect>
                                                                        <rect
                                                                            x="5.5"
                                                                            y="7"
                                                                            width="3"
                                                                            height="7"
                                                                            rx="1.5"
                                                                            className="bar bar2"
                                                                        ></rect>
                                                                        <rect
                                                                            x="10"
                                                                            y="9"
                                                                            width="3"
                                                                            height="5"
                                                                            rx="1.5"
                                                                            className="bar bar3"
                                                                        ></rect>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="text">
                                                                {result.name}{' '}
                                                                <span className="artist">({result.artistName})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <NavLink
                                                        key={`${result.type}-${result.id}`}
                                                        to={`/${result.type.toLowerCase()}/${result.id}`}
                                                        onClick={props.closeSidenav}
                                                        className="result"
                                                    >
                                                        {result.type === 'Artist' && (
                                                            <div className="type artist">
                                                                <div className="icon" title="Artist">
                                                                    <svg
                                                                        width="14"
                                                                        height="14"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 16.1328 15.7715"
                                                                    >
                                                                        <g>
                                                                            <rect
                                                                                height="15.7715"
                                                                                opacity="0"
                                                                                width="16.1328"
                                                                                x="0"
                                                                                y="0"
                                                                            />
                                                                            <path d="M7.88086 15.7617C12.2363 15.7617 15.7715 12.2363 15.7715 7.88086C15.7715 3.52539 12.2363 0 7.88086 0C3.53516 0 0 3.52539 0 7.88086C0 12.2363 3.53516 15.7617 7.88086 15.7617ZM7.88086 14.2773C4.3457 14.2773 1.49414 11.416 1.49414 7.88086C1.49414 4.3457 4.3457 1.48438 7.88086 1.48438C11.416 1.48438 14.2773 4.3457 14.2773 7.88086C14.2773 11.416 11.416 14.2773 7.88086 14.2773ZM13.1445 12.959L13.1152 12.8613C12.7637 11.7188 10.7227 10.5078 7.88086 10.5078C5.03906 10.5078 3.00781 11.7188 2.65625 12.8613L2.62695 12.959C4.02344 14.3164 6.50391 15.0879 7.88086 15.0879C9.26758 15.0879 11.748 14.3164 13.1445 12.959ZM7.88086 9.21875C9.35547 9.23828 10.5176 7.97852 10.5176 6.32812C10.5176 4.77539 9.35547 3.49609 7.88086 3.49609C6.41602 3.49609 5.24414 4.77539 5.25391 6.32812C5.26367 7.97852 6.40625 9.19922 7.88086 9.21875Z" />
                                                                        </g>
                                                                    </svg>
                                                                </div>
                                                                <div className="text">{result.name}</div>
                                                            </div>
                                                        )}
                                                        {result.type === 'Album' && (
                                                            <div className="type album">
                                                                <div className="icon" title="Album">
                                                                    <svg
                                                                        width="14"
                                                                        height="14"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 16.1328 15.7715"
                                                                    >
                                                                        <g>
                                                                            <rect
                                                                                height="15.7715"
                                                                                opacity="0"
                                                                                width="16.1328"
                                                                                x="0"
                                                                                y="0"
                                                                            />
                                                                            <path d="M15.7715 7.88086C15.7715 12.2266 12.2363 15.7617 7.88086 15.7617C3.53516 15.7617 0 12.2266 0 7.88086C0 3.53516 3.53516 0 7.88086 0C12.2363 0 15.7715 3.53516 15.7715 7.88086ZM4.75586 7.87109C4.75586 9.59961 6.15234 10.9961 7.88086 10.9961C9.61914 10.9961 11.0156 9.59961 11.0156 7.87109C11.0156 6.14258 9.61914 4.73633 7.88086 4.73633C6.15234 4.73633 4.75586 6.14258 4.75586 7.87109Z" />
                                                                            <circle
                                                                                className="spindle-hole"
                                                                                cx="7.88086"
                                                                                cy="7.87109"
                                                                                r="1.5"
                                                                            />
                                                                        </g>
                                                                    </svg>
                                                                </div>
                                                                <div className="text">{result.name}</div>
                                                            </div>
                                                        )}
                                                        {result.type === 'Playlist' && (
                                                            <div className="type playlist">
                                                                <div className="icon" title="Playlist">
                                                                    <svg
                                                                        width="14"
                                                                        height="14"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 16.1523 15.9277"
                                                                    >
                                                                        <g>
                                                                            <rect
                                                                                height="15.9277"
                                                                                opacity="0"
                                                                                width="16.1523"
                                                                                x="0"
                                                                                y="0"
                                                                            />
                                                                            <path d="M0.585938 9.82422L7.33398 9.82422C7.66602 9.82422 7.91992 9.57031 7.91992 9.23828C7.91992 8.92578 7.65625 8.66211 7.33398 8.66211L0.585938 8.66211C0.263672 8.66211 0 8.92578 0 9.23828C0 9.57031 0.253906 9.82422 0.585938 9.82422Z" />
                                                                            <path d="M0.585938 7.06055L7.33398 7.06055C7.66602 7.06055 7.91992 6.79688 7.91992 6.47461C7.91992 6.15234 7.65625 5.89844 7.33398 5.89844L0.585938 5.89844C0.263672 5.89844 0 6.15234 0 6.47461C0 6.79688 0.253906 7.06055 0.585938 7.06055Z" />
                                                                            <path d="M0.585938 4.30664L7.33398 4.30664C7.65625 4.30664 7.91992 4.04297 7.91992 3.7207C7.91992 3.39844 7.65625 3.13477 7.33398 3.13477L0.585938 3.13477C0.263672 3.13477 0 3.39844 0 3.7207C0 4.04297 0.263672 4.30664 0.585938 4.30664Z" />
                                                                            <path d="M15.791 3.88672L15.791 0.966797C15.791 0.546875 15.4492 0.263672 15.0391 0.351562L11.0059 1.23047C10.4785 1.34766 10.1953 1.62109 10.1953 2.08008L10.1953 10.6738C10.2441 11.0254 10.0781 11.25 9.77539 11.3086L8.55469 11.5625C6.98242 11.8945 6.25 12.6953 6.25 13.8867C6.25 15.0879 7.17773 15.9277 8.47656 15.9277C9.61914 15.9277 11.3477 15.0781 11.3477 12.8125L11.3477 5.74219C11.3477 5.35156 11.4062 5.29297 11.748 5.22461L15.3516 4.42383C15.625 4.36523 15.791 4.16016 15.791 3.88672Z" />
                                                                        </g>
                                                                    </svg>
                                                                </div>
                                                                <div className="text">{result.name}</div>
                                                            </div>
                                                        )}
                                                    </NavLink>
                                                )
                                            )}
                                            <div className="additional">
                                                <NavLink
                                                    to={`/search/${encodeURIComponent(searchQuery)}`}
                                                    onClick={props.closeSidenav}
                                                    className="textlink"
                                                >
                                                    See more results
                                                </NavLink>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>

                    <div className="playlists">
                        {loading && <div className="indicator loading">Loading playlists...</div>}
                        {error && <div className="indicator error">{error}</div>}
                        {!loading && !error && playlists.length === 0 && !searchQuery && (
                            <div className="indicator info">No playlists found</div>
                        )}
                        {!searchQuery && (
                            <div className="container noSelect">
                                {playlists.map(playlist => (
                                    <NavLink
                                        to={`/playlist/${playlist.Id}`}
                                        key={playlist.Id}
                                        onClick={props.closeSidenav}
                                        className={({ isActive }) => (isActive ? 'playlist active' : 'playlist')}
                                    >
                                        {playlist.Name}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
                <div className="sidenav_footer">
                    <div className="volume">
                        <div className="indicator">Volume: {(props.volume * 100).toFixed(0)}%</div>
                        <div className="control">
                            <input
                                type="range"
                                id="volume"
                                name="volume"
                                min="0"
                                max="1"
                                step="0.01"
                                value={props.volume}
                                onChange={handleVolumeChange}
                                onWheel={handleVolumeScroll}
                                onMouseEnter={() => setDisabled(true)}
                                onMouseLeave={() => setDisabled(false)}
                            />
                        </div>
                    </div>
                    <div className="account">
                        <div className="status">
                            <div className="indicator">Connected</div>
                            <div className="username">{props.username}</div>
                        </div>
                        <NavLink to="/settings" className="settings" onClick={props.closeSidenav}>
                            <GearIcon size={16} />
                        </NavLink>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default Sidenav
