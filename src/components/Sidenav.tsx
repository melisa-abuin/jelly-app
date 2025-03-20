import { GearIcon } from '@primer/octicons-react'
import { NavLink } from 'react-router-dom'
import '../App.css'
import './Sidenav.css'

interface SidenavProps {
    username: string
    showSidenav: boolean
    closeSidenav: () => void
    volume: number
    setVolume: (volume: number) => void
}

const Sidenav = (props: SidenavProps) => {
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
            <div className={props.showSidenav ? 'sidenav_wrapper active' : 'sidenav_wrapper'}>
                <div className="sidenav_header">
                    <div className="logo"></div>
                </div>
                <nav className="sidenav_content noSelect">
                    <ul>
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
