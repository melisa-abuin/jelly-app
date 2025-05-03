import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinPlaylistData } from '../hooks/Jellyfin/useJellyfinPlaylistData'
import { formatDate } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Playlist.css'

const Playlist = () => {
    const playback = usePlaybackContext()

    const { playlistId } = useParams<{ playlistId: string }>()
    const {
        playlist,
        items: tracks,
        loading,
        error,
        totalPlaytime,
        totalTrackCount,
        totalPlays,
    } = useJellyfinPlaylistData(playlistId!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (playlist) {
            setPageTitle(playlist.Name)
        }
        return () => {
            setPageTitle('')
        }
    }, [playlist, setPageTitle])

    if (loading && tracks.length === 0) {
        return <Loader />
    }

    if (error || !playlist) {
        return <div className="error">{error || 'Playlist not found'}</div>
    }

    return (
        <div className="playlist-page">
            <div className="playlist-header">
                <JellyImg item={playlist} type={'Primary'} width={100} height={100} />

                <div className="playlist-details">
                    <div className="title">{playlist.Name}</div>
                    <div className="date">{formatDate(playlist.DateCreated)}</div>
                    <div className="stats">
                        <div className="track-amount">
                            <span className="number">{totalTrackCount}</span>{' '}
                            <span>{totalTrackCount === 1 ? 'Track' : 'Tracks'}</span>
                        </div>
                        <div className="divider"></div>
                        <div className="length">
                            <span className="number">{formatDurationReadable(totalPlaytime)}</span> <span>Total</span>
                        </div>
                        {totalPlays > 0 && (
                            <>
                                <div className="divider"></div>
                                <div className="plays">
                                    <span className="number">{totalPlays}</span> {totalPlays === 1 ? 'Play' : 'Plays'}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="actions noSelect">
                        <div className="primary">
                            <div
                                className="play-playlist"
                                onClick={() => {
                                    playback.setCurrentPlaylist({ playlist: tracks })
                                    playback.playTrack(0)
                                }}
                            >
                                <div className="play-icon" />
                                <div className="text">Play</div>
                            </div>
                            <div
                                className="favorite-state"
                                title={playlist.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {playlist.UserData?.IsFavorite ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                            </div>
                        </div>
                        <div className="more">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 12.1562 2.42969"
                            >
                                <g>
                                    <rect height="2.42969" opacity="0" width="12.1562" x="0" y="0" />
                                    <path d="M10.5391 2.42188C11.2109 2.42188 11.75 1.88281 11.75 1.21094C11.75 0.539062 11.2109 0 10.5391 0C9.875 0 9.32812 0.539062 9.32812 1.21094C9.32812 1.88281 9.875 2.42188 10.5391 2.42188Z" />
                                    <path d="M5.875 2.42188C6.54688 2.42188 7.08594 1.88281 7.08594 1.21094C7.08594 0.539062 6.54688 0 5.875 0C5.20312 0 4.66406 0.539062 4.66406 1.21094C4.66406 1.88281 5.20312 2.42188 5.875 2.42188Z" />
                                    <path d="M1.21094 2.42188C1.88281 2.42188 2.42188 1.88281 2.42188 1.21094C2.42188 0.539062 1.88281 0 1.21094 0C0.539062 0 0 0.539062 0 1.21094C0 1.88281 0.539062 2.42188 1.21094 2.42188Z" />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <PlaylistTrackList tracks={tracks} showType="artist" />
        </div>
    )
}

export default Playlist
