import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinPlaylistData } from '../hooks/useJellyfinPlaylistData'
import { formatDate } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Playlist.css'

const Playlist = () => {
    const playback = usePlaybackContext()

    const { playlistId } = useParams<{ playlistId: string }>()
    const { playlist, tracks, loading, error, loadMore, hasMore, totalPlaytime, totalTrackCount, totalPlays } =
        useJellyfinPlaylistData(playlistId!)
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
                        <div
                            className="play-playlist"
                            onClick={() => {
                                playback.setCurrentPlaylist(tracks)
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
                </div>
            </div>

            <PlaylistTrackList
                tracks={tracks}
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(tracks, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={tracks}
                showType="artist"
            />
        </div>
    )
}

export default Playlist
