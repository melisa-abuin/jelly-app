import { ChevronRightIcon } from '@primer/octicons-react'
import './Dropdown.css'

const Dropdown = () => {
    return (
        <div className="dropdown noSelect">
            <div className="dropdown-menu">
                <div className="dropdown-item play-next">
                    <span>Play next</span>
                </div>
                <div className="dropdown-item add-queue">
                    <span>Add to queue</span>
                </div>
                <div className="dropdown-item instant-mix">
                    <span>Play instant mix</span>
                </div>

                <div className="dropdown-item view-artists has-sub-menu">
                    <span>View artists</span>
                    <ChevronRightIcon size={12} className="icon" />
                    <div className="sub-dropdown boundary='flip flip-y' view-artists">
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Artist 1</div>
                            <div className="dropdown-item">Artist 2</div>
                        </div>
                    </div>
                </div>

                <div className="dropdown-item view-artist">
                    <span>View artist</span>
                </div>
                <div className="dropdown-item view-album">
                    <span>View album</span>
                </div>
                <div className="dropdown-item add-favorite">
                    <span>Add to favorites</span>
                </div>
                <div className="dropdown-item remove-favorite has-removable">
                    <span>Remove from favorites</span>
                </div>

                <div className="dropdown-item add-playlist has-sub-menu">
                    <span>Add to playlist</span>
                    <ChevronRightIcon size={12} className="icon" />
                    <div className="sub-dropdown boundary='flip flip-y' add-playlist">
                        <div className="dropdown-menu">
                            <div className="dropdown-item">
                                <div className="playlist-input-container">
                                    <input type="text" placeholder="New..." className="playlist-input" />
                                    <button className="create-btn">Create</button>
                                </div>
                            </div>
                            <div className="dropdown-item">Playlist 1</div>
                            <div className="dropdown-item">Playlist 2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dropdown
