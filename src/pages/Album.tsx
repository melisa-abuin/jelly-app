import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinAlbumData } from '../hooks/useJellyfinAlbumData'
import { formatDate } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Album.css'

const Album = () => {
    const playback = usePlaybackContext()
    const { albumId } = useParams<{ albumId: string }>()
    const { album, tracks, discCount, loading, error } = useJellyfinAlbumData(albumId!)
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

    if (loading) {
        return <Loader />
    }

    if (error || !album) {
        return <div className="error">{error || 'Album not found'}</div>
    }

    const totalPlays = tracks.reduce((total, track) => total + (track.UserData?.PlayCount || 0), 0)
    const trackCount = album.ChildCount || tracks.length

    const tracksByDisc = tracks.reduce((acc, track) => {
        const discNumber = track.ParentIndexNumber || 1
        if (!acc[discNumber]) {
            acc[discNumber] = []
        }
        acc[discNumber].push(track)
        return acc
    }, {} as Record<number, MediaItem[]>)

    const sortedTracks = Object.keys(tracksByDisc)
        .sort((a, b) => Number(a) - Number(b))
        .flatMap(discNumber =>
            tracksByDisc[Number(discNumber)].sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0))
        )

    return (
        <div className="album-page">
            <div className="album-header">
                <JellyImg item={album} type={'Primary'} width={100} height={100} />
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
                                playback.setCurrentPlaylist({ playlist: sortedTracks })
                                playback.playTrack(0)
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

            {Object.keys(tracksByDisc)
                .sort((a, b) => Number(a) - Number(b))
                .map((discNumber, index) => (
                    <div className="album-content" key={discNumber}>
                        {discCount > 1 && <div className={`disc ${index === 0 ? 'first' : ''}`}>Disc {discNumber}</div>}
                        <TrackList tracks={tracksByDisc[Number(discNumber)]} playlist={sortedTracks} />
                    </div>
                ))}
        </div>
    )
}

export default Album
