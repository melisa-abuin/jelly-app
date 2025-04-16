import { HeartFillIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { JellyImg } from '../components/JellyImg'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import './SearchResults.css'

interface SearchResult {
    type: 'Artist' | 'Album' | 'Playlist' | 'Song'
    id: string
    name: string
    thumbnailUrl?: string
    artists?: string[]
    totalTracks?: number
    isFavorite?: boolean
    _mediaItem: MediaItem
}

const SearchResults = () => {
    const api = useJellyfinContext()

    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const [results, setResults] = useState<{
        artists: SearchResult[]
        albums: SearchResult[]
        playlists: SearchResult[]
        songs: MediaItem[]
    }>({
        artists: [],
        albums: [],
        playlists: [],
        songs: [],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (query) {
            setPageTitle(`Search results for '${query}'`)
        }

        const fetchSearchResults = async () => {
            if (!query) return

            setLoading(true)
            setError(null)

            try {
                const [artistItems, albumItems, playlistItems, songs] = await Promise.all([
                    api.searchArtistsDetailed(query, 10),
                    api.searchAlbumsDetailed(query, 10),
                    api.searchPlaylistsDetailed(query, 10),
                    api.fetchSongs(query),
                ])

                const artists = artistItems.map(artist => ({
                    type: 'Artist' as const,
                    id: artist.Id,
                    name: artist.Name,
                    thumbnailUrl: api.getImageUrl(artist, 'Primary', { width: 36, height: 36 }),
                    isFavorite: artist.UserData?.IsFavorite || false,
                    _mediaItem: artist,
                }))

                const albums = albumItems.map(item => ({
                    type: 'Album' as const,
                    id: item.Id,
                    name: item.Name,
                    thumbnailUrl: api.getImageUrl(item, 'Primary', { width: 46, height: 46 }),
                    artists: [item.AlbumArtists?.[0]?.Name || item.AlbumArtist || 'Unknown Artist'],
                    isFavorite: item.UserData?.IsFavorite || false,
                    _mediaItem: item,
                }))

                const playlists = playlistItems.map(playlist => ({
                    type: 'Playlist' as const,
                    id: playlist.Id,
                    name: playlist.Name,
                    thumbnailUrl: api.getImageUrl(playlist, 'Primary', { width: 46, height: 46 }),
                    totalTracks: playlist.ChildCount || 0,
                    isFavorite: playlist.UserData?.IsFavorite || false,
                    _mediaItem: playlist,
                }))

                setResults({ artists, albums, playlists, songs })
            } catch (err) {
                console.error('Search Error:', err)
                setError('Failed to load search results')
            } finally {
                setLoading(false)
            }
        }

        fetchSearchResults()

        return () => setPageTitle('')
    }, [query, setPageTitle, api])

    if (loading) return <Loader />
    if (error) return <div>{error}</div>
    if (!query) return <div>Enter a search query to see results.</div>

    return (
        <div className="search-results-page">
            <div className="search-content">
                {results.songs.length > 0 && (
                    <div className="section songs">
                        <TrackList tracks={results.songs} />
                    </div>
                )}

                {results.artists.length > 0 && (
                    <div className="section artists">
                        <div className="title">Artists</div>
                        <div className="section-list noSelect">
                            {results.artists.map(artist => (
                                <Link to={`/artist/${artist.id}`} key={artist.id} className="section-item">
                                    {artist.thumbnailUrl && (
                                        <JellyImg item={artist._mediaItem} type={'Primary'} width={36} height={36} />
                                    )}
                                    <div className="section-info">
                                        <div className="name">{artist.name}</div>
                                    </div>
                                    {artist.isFavorite && (
                                        <div className="favorited" title="Favorited">
                                            <HeartFillIcon size={16} />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {results.albums.length > 0 && (
                    <div className="section albums">
                        <div className="title">Albums</div>
                        <div className="section-list noSelect">
                            {results.albums.map(album => (
                                <Link to={`/album/${album.id}`} key={album.id} className="section-item">
                                    {album.thumbnailUrl && (
                                        <JellyImg item={album._mediaItem} type={'Primary'} width={46} height={46} />
                                    )}
                                    <div className="section-info">
                                        <div className="name">{album.name}</div>
                                        <div className="desc album-artists">
                                            {album.artists?.[0] || 'Unknown Artist'}
                                        </div>
                                    </div>
                                    {album.isFavorite && (
                                        <div className="favorited" title="Favorited">
                                            <HeartFillIcon size={16} />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {results.playlists.length > 0 && (
                    <div className="section playlists">
                        <div className="title">Playlists</div>
                        <div className="section-list noSelect">
                            {results.playlists.map(playlist => (
                                <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="section-item">
                                    {playlist.thumbnailUrl && (
                                        <JellyImg item={playlist._mediaItem} type={'Primary'} width={46} height={46} />
                                    )}
                                    <div className="section-info">
                                        <div className="name">{playlist.name}</div>
                                        <div className="desc track-amount">{playlist.totalTracks} tracks</div>
                                    </div>
                                    {playlist.isFavorite && (
                                        <div className="favorited" title="Favorited">
                                            <HeartFillIcon size={16} />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {results.artists.length === 0 &&
                    results.albums.length === 0 &&
                    results.playlists.length === 0 &&
                    results.songs.length === 0 && <div>No results found for '{query}'.</div>}
            </div>
        </div>
    )
}

export default SearchResults
