import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { usePageTitle } from '../context/PageTitleContext'
import { useJellyfinAlbumData } from '../hooks/useJellyfinAlbumData'
import { formatDurationReadable } from '../utils/formatDurationReadable'
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

    const totalPlaytime = tracks.reduce((total, track) => total + (track.RunTimeTicks || 0), 0)

    const formatDate = (date?: string) => {
        if (!date) return 'Unknown Date'
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

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
                    <div className="artist">
                        {album.AlbumArtists && album.AlbumArtists.length > 0 ? (
                            <Link to={`/artist/${album.AlbumArtists[0].Id}`}>
                                {album.AlbumArtist || 'Unknown Artist'}
                            </Link>
                        ) : (
                            album.AlbumArtist || 'Unknown Artist'
                        )}
                    </div>
                    <div className="date">{formatDate(album.PremiereDate)}</div>
                    <div className="stats">
                        <div className="track-amount">
                            <span className="number">{trackCount}</span>{' '}
                            <span>{trackCount === 1 ? 'Track' : 'Tracks'}</span>
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

            <TrackList
                tracks={tracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                setCurrentPlaylist={setCurrentPlaylist}
                playTrack={playTrack}
            />
        </div>
    )
}

export default Album
