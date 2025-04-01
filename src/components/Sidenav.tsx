import { GearIcon, SearchIcon, XCircleIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MediaItem, searchArtists } from '../api/jellyfin'
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
                    const itemsResponse = await api.get<{ Items: MediaItem[] }>(
                        `${props.serverUrl}/Users/${props.userId}/Items`,
                        {
                            params: {
                                searchTerm: searchQuery,
                                IncludeItemTypes: 'MusicAlbum,Playlist,Audio',
                                Recursive: true,
                                Limit: 40,
                                Fields: 'ArtistItems',
                            },
                            headers: { 'X-Emby-Token': props.token },
                        }
                    )
                    const items = itemsResponse.data.Items || []

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
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 52 54"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M 41.83984375,16.7578125 L 41.83984375,9.302734375 C 41.83984375,8.099609375 40.89453125,7.3046875 39.712890625,7.5625 L 28.390625,9.990234375 C 27.015625,10.291015625 26.328125,10.978515625 26.328125,12.1171875 L 26.478515625,34.9765625 C 26.478515625,36.05078125 25.94140625,36.759765625 24.99609375,36.953125 L 21.623046875,37.662109375 C 17.43359375,38.54296875 15.478515625,40.6484375 15.478515625,43.806640625 C 15.478515625,46.986328125 17.90625,49.19921875 21.365234375,49.19921875 C 24.458984375,49.19921875 29.03515625,46.96484375 29.03515625,40.86328125 L 29.03515625,22.193359375 C 29.03515625,21.033203125 29.271484375,20.796875 30.32421875,20.5390625 L 40.59375,18.283203125 C 41.3671875,18.1328125 41.83984375,17.53125 41.83984375,16.7578125 Z" />
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
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 22 22"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M10.9912 19.7422C15.9746 19.7422 20.0879 15.6289 20.0879 10.6543C20.0879 5.67969 15.9658 1.56641 10.9824 1.56641C6.00781 1.56641 1.90332 5.67969 1.90332 10.6543C1.90332 15.6289 6.0166 19.7422 10.9912 19.7422ZM10.9912 13.6953C8.5127 13.6953 6.58789 14.583 5.65625 15.6025C4.46094 14.3105 3.73145 12.5703 3.73145 10.6543C3.73145 6.62012 6.95703 3.38574 10.9824 3.38574C15.0166 3.38574 18.2598 6.62012 18.2686 10.6543C18.2686 12.5703 17.5391 14.3105 16.335 15.6113C15.4033 14.583 13.4785 13.6953 10.9912 13.6953ZM10.9912 12.2539C12.6963 12.2715 14.0234 10.8125 14.0234 8.93164C14.0234 7.15625 12.6875 5.6709 10.9912 5.6709C9.30371 5.6709 7.95898 7.15625 7.96777 8.93164C7.97656 10.8125 9.29492 12.2451 10.9912 12.2539Z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="text">{result.name}</div>
                                                            </div>
                                                        )}
                                                        {result.type === 'Album' && (
                                                            <div className="type album">
                                                                <div className="icon" title="Album">
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
                                                                        <circle
                                                                            className="spindle-hole"
                                                                            cx="11"
                                                                            cy="10.6455"
                                                                            r="1.5"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className="text">{result.name}</div>
                                                            </div>
                                                        )}
                                                        {result.type === 'Playlist' && (
                                                            <div className="type playlist">
                                                                <div className="icon" title="Playlist">
                                                                    <svg
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 52 54"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M 41.83984375,16.7578125 L 41.83984375,9.302734375 C 41.83984375,8.099609375 40.89453125,7.3046875 39.712890625,7.5625 L 28.390625,9.990234375 C 27.015625,10.291015625 26.328125,10.978515625 26.328125,12.1171875 L 26.478515625,34.9765625 C 26.478515625,36.05078125 25.94140625,36.759765625 24.99609375,36.953125 L 21.623046875,37.662109375 C 17.43359375,38.54296875 15.478515625,40.6484375 15.478515625,43.806640625 C 15.478515625,46.986328125 17.90625,49.19921875 21.365234375,49.19921875 C 24.458984375,49.19921875 29.03515625,46.96484375 29.03515625,40.86328125 L 29.03515625,22.193359375 C 29.03515625,21.033203125 29.271484375,20.796875 30.32421875,20.5390625 L 40.59375,18.283203125 C 41.3671875,18.1328125 41.83984375,17.53125 41.83984375,16.7578125 Z" />
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
