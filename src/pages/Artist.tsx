import { HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { useJellyfinContext } from '../context/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext'
import { useJellyfinArtistData } from '../hooks/useJellyfinArtistData'
import { useJellyfinPlaylistsFeaturingArtist } from '../hooks/useJellyfinPlaylistsFeaturingArtist'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './Artist.css'

interface ArtistProps {
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
}

const Artist = ({ playTrack, currentTrack, isPlaying, togglePlayPause, setCurrentPlaylist }: ArtistProps) => {
    const api = useJellyfinContext()
    const { artistId } = useParams<{ artistId: string }>()
    const { artist, tracks, albums, appearsInAlbums, totalTrackCount, totalPlaytime, totalPlays, loading, error } =
        useJellyfinArtistData(artistId!)
    const {
        playlists,
        loading: playlistsLoading,
        error: playlistsError,
    } = useJellyfinPlaylistsFeaturingArtist(artistId!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (artist) {
            setPageTitle(artist.Name)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    const formatDate = (date?: string) => {
        if (!date) return 'Unknown Date'
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric' })
    }

    if (loading) {
        return <Loader />
    }

    if (error || !artist) {
        return <div className="error">{error || 'Artist not found'}</div>
    }

    const topSongs = tracks
        .map(track => ({
            ...track,
            playCount: track.UserData?.PlayCount || 0,
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 5)

    const allAlbums = [...albums, ...appearsInAlbums]
    const genres = Array.from(new Set(allAlbums.flatMap(album => album.Genres || []))).sort()

    return (
        <div className="artist-page">
            <div className="artist-header">
                <img
                    src={
                        artist.ImageTags?.Primary
                            ? `${api.auth.serverUrl}/Items/${artist.Id}/Images/Primary?tag=${artist.ImageTags.Primary}&quality=100&fillWidth=100&fillHeight=100&format=webp&api_key=${api.auth.token}`
                            : '/default-thumbnail.png'
                    }
                    alt={artist.Name}
                    className="thumbnail"
                    onError={e => {
                        ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                    }}
                />
                <div className="artist-details">
                    <div className="artist">{artist.Name}</div>
                    {genres.length > 0 && (
                        <>
                            <div className="genres">
                                {genres.slice(0, 8).map((genre, index) => (
                                    <span key={genre}>
                                        <Link to={`/genre/${encodeURIComponent(genre)}`}>{genre}</Link>
                                        {index < genres.slice(0, 8).length - 1 && ', '}
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
                        <div
                            className="play-artist"
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
                            title={artist.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {artist.UserData?.IsFavorite ? <HeartFillIcon size={16} /> : <HeartIcon size={16} />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="artist-content">
                {topSongs.length > 0 && (
                    <div className="section top-songs">
                        <TrackList
                            tracks={topSongs}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            togglePlayPause={togglePlayPause}
                            setCurrentPlaylist={setCurrentPlaylist}
                            playTrack={playTrack}
                            showAlbumLink={true}
                        />
                    </div>
                )}

                {albums.length > 0 && (
                    <div className="section albums">
                        <div className="title">Albums</div>
                        <div className="desc">Complete discography</div>
                        <div className="section-list noSelect">
                            {albums.map(album => (
                                <Link to={`/album/${album.Id}`} key={album.Id} className="section-item">
                                    <img
                                        src={
                                            album.ImageTags?.Primary
                                                ? `${api.auth.serverUrl}/Items/${album.Id}/Images/Primary?tag=${album.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${api.auth.token}`
                                                : '/default-thumbnail.png'
                                        }
                                        alt={album.Name}
                                        className="thumbnail"
                                        loading="lazy"
                                        onError={e => {
                                            ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                                        }}
                                    />
                                    <div className="section-info">
                                        <div className="name">{album.Name}</div>
                                        <div className="date">{formatDate(album.PremiereDate)}</div>
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
                                    <img
                                        src={
                                            album.ImageTags?.Primary
                                                ? `${api.auth.serverUrl}/Items/${album.Id}/Images/Primary?tag=${album.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${api.auth.token}`
                                                : '/default-thumbnail.png'
                                        }
                                        alt={album.Name}
                                        className="thumbnail"
                                        loading="lazy"
                                        onError={e => {
                                            ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                                        }}
                                    />
                                    <div className="section-info">
                                        <div className="name">{album.Name}</div>
                                        <div className="container">
                                            <div className="year">{formatDate(album.PremiereDate)}</div>
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
                                            <img
                                                src={
                                                    playlist.ImageTags?.Primary
                                                        ? `${api.auth.serverUrl}/Items/${playlist.Id}/Images/Primary?tag=${playlist.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${api.auth.token}`
                                                        : '/default-thumbnail.png'
                                                }
                                                alt={playlist.Name}
                                                className="thumbnail"
                                                loading="lazy"
                                                onError={e => {
                                                    ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                                                }}
                                            />
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
