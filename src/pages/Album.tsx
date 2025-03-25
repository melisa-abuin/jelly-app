import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { usePageTitle } from '../App'
import Loader from '../components/Loader'
import { useJellyfinAlbumData } from '../hooks/useJellyfinAlbumData'
import './Album.css'

interface AlbumProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
}

const Album = ({
    user,
    serverUrl,
    token,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
}: AlbumProps) => {
    const { albumId } = useParams<{ albumId: string }>()
    const { album, tracks, loading, error } = useJellyfinAlbumData(serverUrl, user.userId, token, albumId!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (album) {
            setPageTitle(album.Name)
        }
        return () => {
            setPageTitle('')
        }
    }, [album, setPageTitle])

    const formatDuration = (ticks?: number) => {
        if (!ticks) return '0:00'
        const seconds = Math.floor(ticks / 10000000)
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const totalPlaytime = tracks.reduce((total, track) => total + (track.RunTimeTicks || 0), 0)

    const formatDate = (date?: string) => {
        if (!date) return 'Unknown Date'
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

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

    if (loading) {
        return <Loader />
    }

    if (error || !album) {
        return <div className="error">{error || 'Album not found'}</div>
    }

    const totalPlays = tracks.reduce((total, track) => total + (track.UserData?.PlayCount || 0), 0)
    const trackCount = album.ChildCount || tracks.length

    return (
        <div className="album-page">
            <div className="album-header">
                <img
                    src={
                        album.ImageTags?.Primary
                            ? `${serverUrl}/Items/${album.Id}/Images/Primary?tag=${album.ImageTags.Primary}&quality=100&fillWidth=100&fillHeight=100&format=webp&api_key=${token}`
                            : '/default-thumbnail.png'
                    }
                    alt={album.Name}
                    className="thumbnail"
                    onError={e => {
                        ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                    }}
                />
                <div className="album-details">
                    <div className="artist">{album.AlbumArtist || 'Unknown Artist'}</div>
                    <div className="date">{formatDate(album.DateCreated)}</div>
                    <div className="stats">
                        <div className="track-amount">
                            <span className="number">{trackCount}</span>{' '}
                            <span>{trackCount === 1 ? 'Track' : 'Tracks'}</span>
                        </div>
                        <div className="divider"></div>
                        <div className="length">
                            <span className="number">{formatDuration(totalPlaytime)}</span> <span>Total</span>
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
                            className="play-album"
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
                            title={album.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {album.UserData?.IsFavorite ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                        </div>
                    </div>
                </div>
            </div>

            <ul className="tracklist noSelect">
                {tracks.map((track, index) => {
                    const isCurrentTrack = currentTrack?.Id === track.Id
                    const isMostPlayed = mostPlayedTracks.includes(track.Id)
                    const itemClass = [
                        isCurrentTrack ? (isPlaying ? 'playing' : 'paused') : '',
                        isMostPlayed ? 'most-played' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')

                    return (
                        <li
                            key={track.Id}
                            className={`track-item ${itemClass}`}
                            onClick={() => {
                                if (isCurrentTrack) {
                                    togglePlayPause()
                                } else {
                                    setCurrentPlaylist(tracks)
                                    playTrack(track, index)
                                }
                            }}
                        >
                            <div className="track-indiactor">
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
                                            <rect
                                                x="1"
                                                y="10"
                                                width="3"
                                                height="8"
                                                rx="1.5"
                                                className="bar bar1"
                                            ></rect>
                                            <rect x="5" y="9" width="3" height="9" rx="1.5" className="bar bar2"></rect>
                                            <rect
                                                x="9"
                                                y="11"
                                                width="3"
                                                height="7"
                                                rx="1.5"
                                                className="bar bar3"
                                            ></rect>
                                            <rect
                                                x="13"
                                                y="10"
                                                width="3"
                                                height="8"
                                                rx="1.5"
                                                className="bar bar4"
                                            ></rect>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="track-details">
                                <div className="container">
                                    <div className="name">
                                        <div className="text">{track.Name}</div>
                                    </div>
                                    <div className="artist">
                                        {track.Artists && track.Artists.length > 0
                                            ? track.Artists.join(', ')
                                            : 'Unknown Artist'}
                                    </div>
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
        </div>
    )
}

export default Album
