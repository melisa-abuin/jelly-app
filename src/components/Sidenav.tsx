import { GearIcon } from '@primer/octicons-react'
import { NavLink } from 'react-router-dom'
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
}

const Sidenav = (props: SidenavProps) => {
    const { playlists, loading, error } = useJellyfinPlaylistsList(props.serverUrl, props.userId, props.token)
    const { disabled, setDisabled } = useScrollContext()

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
                    {/*
                    <div className="search">
                        <div className="input_container">
                            <div className="search-icon noSelect">
                                <SearchIcon size={14} />
                            </div>
                            <input type="search" placeholder="Search" />
                        </div>
                        <div className="search_results">
                            <div className="empty">
                                Search for <span className="keyword">'keyword'</span> yields no results.
                            </div>
                        </div>
                    </div>
                    */}
                    <div className="playlists">
                        {loading && <div className="indicator loading">Loading playlists...</div>}
                        {error && <div className="indicator error">{error}</div>}
                        {!loading && !error && playlists.length === 0 && (
                            <div className="indicator info">No playlists found</div>
                        )}
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
