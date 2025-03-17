import { GearIcon } from '@primer/octicons-react';
import { NavLink } from 'react-router-dom';
import '../App.css';
import './Sidenav.css';

interface SidenavProps {
    username: string;
    showSidenav: boolean;
    closeSidenav: () => void;
}

const Sidenav = (props: SidenavProps) => {
    return (
        <aside className="sidenav">
            <div className={props.showSidenav ? 'sidenav_wrapper active' : 'sidenav_wrapper'}>
                <div className="sidenav_header">
                    <div className="logo"></div>
                </div>
                <nav className="sidenav_content">
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
                        <div className="indicator">Volume: 20%</div>
                        <div className="control">
                            <input
                                type="range"
                                id="volume"
                                name="volume"
                                min="0"
                                max="1"
                                step="0.01"
                                defaultValue={0.1}
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
    );
};

export default Sidenav;
