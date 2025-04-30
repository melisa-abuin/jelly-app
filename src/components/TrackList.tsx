import { HeartFillIcon } from '@primer/octicons-react'
import { useContext, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { DropdownContext } from '../context/DropdownContext/DropdownContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinPlaylistsList } from '../hooks/Jellyfin/useJellyfinPlaylistsList'
import { useDropdown } from '../hooks/useDropdown'
import { defaultMenuItems } from '../utils/dropdownMenuItems'
import { formatDuration } from '../utils/formatDuration'
import './TrackList.css'

interface TrackListProps {
    tracks: MediaItem[]
    playlist?: MediaItem[]
    showAlbum?: boolean
}

const TrackList = ({ tracks, playlist, showAlbum = false }: TrackListProps) => {
    const playback = usePlaybackContext()
    const location = useLocation()
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const { playlists } = useJellyfinPlaylistsList()
    const { selectedItem } = useContext(DropdownContext)!

    const MIN_PLAY_COUNT = 5
    const mostPlayedTracks = tracks
        .map(track => ({
            ...track,
            playCount: track.UserData?.PlayCount || 0,
        }))
        .filter(track => track.playCount >= MIN_PLAY_COUNT)
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 3)
        .map(track => track.Id)

    return (
        <ul className="tracklist noSelect">
            {tracks.map((track, index) => {
                const isCurrentTrack = playback.currentTrack?.Id === track.Id
                const isMostPlayed = mostPlayedTracks.includes(track.Id)
                const isActive = selectedItem?.Id === track.Id
                const itemClass = [
                    isCurrentTrack ? (playback.isPlaying ? 'playing' : 'paused') : '',
                    isMostPlayed ? 'most-played' : '',
                    isActive ? 'active' : '',
                ]
                    .filter(Boolean)
                    .join(' ')

                const itemRef = useRef<HTMLLIElement>(null)
                const menuItems = defaultMenuItems(track, navigate, playback, api, playlists).filter(
                    item =>
                        !(location.pathname.includes('/album') && item.label === 'View album') &&
                        !(
                            location.pathname.includes('/artist') &&
                            (item.label === 'View artist' || item.label === 'View artists')
                        )
                )
                const { onContextMenu, onTouchStart, onTouchEnd } = useDropdown(track, menuItems, itemRef)

                return (
                    <li
                        key={track.Id}
                        className={`track-item ${itemClass}`}
                        ref={itemRef}
                        onClick={() => {
                            if (isCurrentTrack) {
                                playback.togglePlayPause()
                            } else {
                                const tracksToPlay = playlist || tracks
                                playback.setCurrentPlaylist({ playlist: tracksToPlay })
                                const playIndex = playlist ? playlist.findIndex(t => t.Id === track.Id) : index
                                playback.playTrack(playIndex)
                            }
                        }}
                        onContextMenu={onContextMenu}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className="track-indicator">
                            <div className="track-number">{index + 1}</div>
                            <div className="track-state">
                                <div className="play">
                                    <div className="play-icon"></div>
                                </div>
                                <div className="pause">
                                    <div className="pause-icon"></div>
                                </div>
                                <div className="play-state-animation">
                                    <svg width="18" height="18" viewBox="0 0 18 18" className="sound-bars">
                                        <rect x="1" y="10" width="3" height="8" rx="1.5" className="bar bar1"></rect>
                                        <rect x="5" y="9" width="3" height="9" rx="1.5" className="bar bar2"></rect>
                                        <rect x="9" y="11" width="3" height="7" rx="1.5" className="bar bar3"></rect>
                                        <rect x="13" y="10" width="3" height="8" rx="1.5" className="bar bar4"></rect>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="track-details">
                            <div className="container">
                                <div className="name">
                                    <div className="text">{track.Name}</div>
                                </div>
                                {showAlbum ? (
                                    <div className="album">
                                        <div className="text">{track.Album || 'Unknown Album'}</div>
                                    </div>
                                ) : (
                                    <div className="artist">
                                        {track.Artists && track.Artists.length > 0
                                            ? track.Artists.join(', ')
                                            : 'Unknown Artist'}
                                    </div>
                                )}
                            </div>
                            {track.UserData?.IsFavorite && (
                                <div className="favorited" title="Favorited">
                                    <HeartFillIcon size={12} />
                                </div>
                            )}
                            <div className="duration">{formatDuration(track.RunTimeTicks)}</div>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export default TrackList
