import { GearIcon } from '@primer/octicons-react';
import { NavLink } from 'react-router-dom';
import '../App.css';

interface SidenavProps {
    username: string;
    onLogout: () => void; // Keep for now, though unused?future-proofing
}

const Sidenav = ({ username }: SidenavProps) => (
    <aside className="sidenav">
        <div className="sidenav_wrapper">
            <div className="sidenav_header">
                <div className="logo"></div>
            </div>
            <nav className="sidenav_content">
                <ul>
                    <li>
                        <NavLink to="/">Home</NavLink>
                    </li>
                    <li>
                        <NavLink to="/tracks">Tracks</NavLink>
                    </li>
                    <li>
                        <NavLink to="/albums">Albums</NavLink>
                    </li>
                    <li>
                        <NavLink to="/favorites">Favorites</NavLink>
                    </li>
                </ul>
            </nav>
            <div className="sidenav_footer">
                <div className="volume">
                    <div className="indicator">Volume: 20%</div>
                    <div className="control">
                        <input type="range" id="volume" name="volume" min="0" max="1" step="0.01" defaultValue={0.1} />
                    </div>
                </div>
                <div className="account">
                    <div className="status">
                        <div className="indicator">Connected</div>
                        <div className="username">{username}</div>
                    </div>
                    <NavLink to="/settings" className="settings">
                        <GearIcon size={16} />
                    </NavLink>
                </div>
            </div>
        </div>
    </aside>
);

export default Sidenav;
