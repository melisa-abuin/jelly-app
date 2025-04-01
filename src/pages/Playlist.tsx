import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { VirtuosoHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { useJellyfinContext } from '../context/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext'
import { useJellyfinPlaylistData } from '../hooks/useJellyfinPlaylistData'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Playlist.css'

interface PlaylistProps {
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    currentTrackIndex: number
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
}

const Playlist = ({
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
}: PlaylistProps) => {
    const api = useJellyfinContext()
    const { playlistId } = useParams<{ playlistId: string }>()
    const { playlist, tracks, loading, error, loadMore, hasMore, totalPlaytime, totalTrackCount, totalPlays } =
        useJellyfinPlaylistData(playlistId!)
    const { setPageTitle } = usePageTitle()
    const virtuosoRef = useRef<VirtuosoHandle | null>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        if (playlist) {
            setPageTitle(playlist.Name)
        }
        return () => {
            setPageTitle('')
        }
    }, [playlist, setPageTitle])

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = parseInt(savedIndex, 10)
            if (index >= 0 && tracks.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (tracks.length > index || !hasMore) {
                        setIsPreloading(false)
                        hasPreloaded.current = true
                        return
                    }

                    if (loading) {
                        setTimeout(loadAdditionalTracks, 100)
                        return
                    }

                    await loadMore()
                    setTimeout(loadAdditionalTracks, 100)
                }

                loadAdditionalTracks()
            } else {
                hasPreloaded.current = true
                setIsPreloading(false)
            }
        } else {
            hasPreloaded.current = true
            setIsPreloading(false)
        }
    }, [tracks.length, hasMore, loading, loadMore, isPreloading])

    if (loading && tracks.length === 0) {
        return <Loader />
    }

    if (error || !playlist) {
        return <div className="error">{error || 'Playlist not found'}</div>
    }

    const formatDate = (date?: string) => {
        if (!date) return 'Unknown Date'
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    return (
        <div className="playlist-page">
            <div className="playlist-header">
                <img
                    src={
                        playlist.ImageTags?.Primary
                            ? `${api.auth.serverUrl}/Items/${playlist.Id}/Images/Primary?tag=${playlist.ImageTags.Primary}&quality=100&fillWidth=100&fillHeight=100&format=webp&api_key=${api.auth.token}`
                            : '/default-thumbnail.png'
                    }
                    alt={playlist.Name}
                    className="thumbnail"
                    onError={e => {
                        ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                    }}
                />
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
                                setCurrentPlaylist(tracks)
                                playTrack(tracks[0], 0)
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
                virtuosoRef={virtuosoRef}
                tracks={tracks}
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    setCurrentPlaylist(tracks)
                    playTrack(track, index)
                }}
                currentTrack={currentTrack}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                playlist={tracks}
            />
        </div>
    )
}

export default Playlist
