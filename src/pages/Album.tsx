import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinAlbumData } from '../hooks/Jellyfin/useJellyfinAlbumData'
import { useJellyfinPlaylistsList } from '../hooks/Jellyfin/useJellyfinPlaylistsList'
import { formatDate } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Album.css'

const Album = () => {
    const playback = usePlaybackContext()
    const { albumId } = useParams<{ albumId: string }>()
    const { album, tracks, discCount, loading, error } = useJellyfinAlbumData(albumId!)
    const { setPageTitle } = usePageTitle()
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const { playlists } = useJellyfinPlaylistsList()
    const dropdown = useDropdownContext()
    const moreRef = useRef<HTMLDivElement>(null)

    const { openDropdown, isOpen, selectedItem, setSelectedItem } = dropdown

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

    const handleMoreClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (moreRef.current && album) {
            const rect = moreRef.current.getBoundingClientRect()
            const x = rect.left - 142
            const y = rect.top + window.pageYOffset + rect.height + 6
            // const menuItems = defaultMenuItems(album, navigate, playback, api, playlists)
            // const filteredMenuItems = menuItems.filter(
            //     item =>
            //         item.label !== 'View artist' &&
            //         item.label !== 'View artists' &&
            //         item.label !== 'View album' &&
            //         item.label !== 'Add to favorites' &&
            //         item.label !== 'Remove from favorites'
            // )
            // const closeEvent = new CustomEvent('close-all-dropdowns', { detail: { exceptId: album.Id } })
            // document.dispatchEvent(closeEvent)
            // openDropdown(album, x, y, filteredMenuItems, true)
            // setSelectedItem(album)
        }
    }

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
                        <div className="primary">
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
                        <div
                            className={`more ${isOpen && selectedItem?.Id === album?.Id ? 'active' : ''}`}
                            onClick={handleMoreClick}
                            ref={moreRef}
                        >
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
