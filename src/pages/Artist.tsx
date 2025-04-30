import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useContext, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { DropdownContext } from '../context/DropdownContext/DropdownContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinArtistData } from '../hooks/Jellyfin/useJellyfinArtistData'
import { useJellyfinPlaylistsFeaturingArtist } from '../hooks/Jellyfin/useJellyfinPlaylistsFeaturingArtist'
import { useJellyfinPlaylistsList } from '../hooks/Jellyfin/useJellyfinPlaylistsList'
import { defaultMenuItems } from '../utils/dropdownMenuItems'
import { formatDateYear } from '../utils/formatDate'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Artist.css'

const Artist = () => {
    const playback = usePlaybackContext()
    const { artistId } = useParams<{ artistId: string }>()
    const { artist, tracks, albums, appearsInAlbums, totalTrackCount, totalPlaytime, totalPlays, loading, error } =
        useJellyfinArtistData(artistId!)
    const {
        playlists,
        loading: playlistsLoading,
        error: playlistsError,
    } = useJellyfinPlaylistsFeaturingArtist(artistId!)
    const { setPageTitle } = usePageTitle()
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const { playlists: allPlaylists } = useJellyfinPlaylistsList()
    const dropdownContext = useContext(DropdownContext)
    const moreRef = useRef<HTMLDivElement>(null)

    if (!dropdownContext) {
        throw new Error('Artist must be used within a DropdownProvider')
    }

    const { openDropdown, isOpen, selectedItem, setSelectedItem } = dropdownContext

    useEffect(() => {
        if (artist) {
            setPageTitle(artist.Name)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    if (loading) {
        return <Loader />
    }

    if (error || !artist) {
        return <div className="error">{error || 'Artist not found'}</div>
    }

    const topSongs = tracks.slice(0, 5)
    const genres = artist.Genres || []

    const handleMoreClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (moreRef.current && artist) {
            const rect = moreRef.current.getBoundingClientRect()
            const x = rect.left - 142
            const y = rect.top + window.pageYOffset + rect.height + 6
            const menuItems = defaultMenuItems(artist, navigate, playback, api, allPlaylists)
            const filteredMenuItems = menuItems.filter(
                item =>
                    item.label !== 'View artist' &&
                    item.label !== 'View artists' &&
                    item.label !== 'View album' &&
                    item.label !== 'Add to favorites' &&
                    item.label !== 'Remove from favorites'
            )
            const closeEvent = new CustomEvent('close-all-dropdowns', { detail: { exceptId: artist.Id } })
            document.dispatchEvent(closeEvent)
            openDropdown(artist, x, y, filteredMenuItems, true)
            setSelectedItem(artist)
        }
    }

    return (
        <div className="artist-page">
            <div className="artist-header">
                <JellyImg item={artist} type={'Primary'} width={100} height={100} />
                <div className="artist-details">
                    <div className="artist">{artist.Name}</div>
                    {genres.length > 0 && (
                        <>
                            <div className="genres">
                                {genres.slice(0, 6).map((genre, index) => (
                                    <span key={genre}>
                                        <Link to={`/genre/${encodeURIComponent(genre)}`}>{genre}</Link>
                                        {index < genres.slice(0, 6).length - 1 && ', '}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="stats">
                        <div className="track-amount">
                            <span className="number">{totalTrackCount}</span>{' '}
                            <span>{totalTrackCount === 1 ? 'Track' : 'Tracks'}</span>
                        </div>
                        <div className="divider"></div>
                        <div className="album-amount">
                            <span className="number">{albums.length}</span>{' '}
                            <span>{albums.length === 1 ? 'Album' : 'Albums'}</span>
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
                                className="play-artist"
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
                                title={artist.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {artist.UserData?.IsFavorite ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                            </div>
                        </div>
                        <div
                            className={`more ${isOpen && selectedItem?.Id === artist?.Id ? 'active' : ''}`}
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

            <div className="artist-content">
                {topSongs.length > 0 && (
                    <div className="section top-songs">
                        <TrackList tracks={topSongs} showAlbum={true} />
                        {(totalTrackCount || 0) > 5 && (
                            <div className="all-tracks">
                                <Link to={`/artist/${artistId}/tracks`} className="textlink">
                                    View all tracks
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {albums.length > 0 && (
                    <div className="section albums">
                        <div className="title">Albums</div>
                        <div className="desc">Complete discography</div>
                        <div className="section-list noSelect">
                            {albums.map(album => (
                                <Link to={`/album/${album.Id}`} key={album.Id} className="section-item">
                                    <JellyImg item={album} type={'Primary'} width={46} height={46} />
                                    <div className="section-info">
                                        <div className="name">{album.Name}</div>
                                        <div className="date">{formatDateYear(album.PremiereDate)}</div>
                                    </div>
                                    {album.UserData?.IsFavorite && (
                                        <div className="favorited" title="Favorited">
                                            <HeartFillIcon size={16} />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {appearsInAlbums.length > 0 && (
                    <div className="section appears-in">
                        <div className="title">Appears In</div>
                        <div className="desc">Additional recordings</div>
                        <div className="section-list noSelect">
                            {appearsInAlbums.map(album => (
                                <Link to={`/album/${album.Id}`} key={album.Id} className="section-item">
                                    <JellyImg item={album} type={'Primary'} width={46} height={46} />
                                    <div className="section-info">
                                        <div className="name">{album.Name}</div>
                                        <div className="container">
                                            <div className="year">{formatDateYear(album.PremiereDate)}</div>
                                            <div className="divider" />
                                            <div className="artist">{album.AlbumArtist || 'Various Artists'}</div>
                                        </div>
                                    </div>
                                    {album.UserData?.IsFavorite && (
                                        <div className="favorited" title="Favorited">
                                            <HeartFillIcon size={16} />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {playlists.length > 0 && (
                    <div className="section playlists">
                        {playlistsLoading ? (
                            <Loader />
                        ) : (
                            <>
                                <div className="title">Playlists</div>
                                <div className="desc">Included in curated collections</div>
                                <div className="section-list noSelect">
                                    {playlists.map(playlist => (
                                        <Link
                                            to={`/playlist/${playlist.Id}`}
                                            key={playlist.Id}
                                            className="section-item"
                                        >
                                            <JellyImg item={playlist} type={'Primary'} width={46} height={46} />
                                            <div className="section-info">
                                                <div className="name">{playlist.Name}</div>
                                                <div className="track-amount">
                                                    <span className="number">{playlist.ChildCount || 0}</span>{' '}
                                                    <span>{(playlist.ChildCount || 0) === 1 ? 'Track' : 'Tracks'}</span>
                                                </div>
                                            </div>
                                            {playlist.UserData?.IsFavorite && (
                                                <div className="favorited" title="Favorited">
                                                    <HeartFillIcon size={16} />
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                        {playlistsError && !playlistsLoading && <div className="error">{playlistsError}</div>}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Artist
