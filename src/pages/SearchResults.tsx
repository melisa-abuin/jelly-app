import { BookmarkFillIcon, HeartFillIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { TrackList } from '../components/TrackList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import './SearchResults.css'

interface SearchResult {
    type: 'Artist' | 'Album' | 'Playlist' | 'Song' | 'Genre'
    id: string
    name: string
    thumbnailUrl?: string
    artists?: string[]
    totalTracks?: number
    isFavorite?: boolean
    _mediaItem: MediaItem
}

export const SearchResults = () => {
    const api = useJellyfinContext()

    const { query } = useParams<{ query: string }>()
    const { setPageTitle } = usePageTitle()
    const [results, setResults] = useState<{
        artists: SearchResult[]
        albums: SearchResult[]
        playlists: SearchResult[]
        songs: MediaItem[]
        genres: SearchResult[]
    }>({
        artists: [],
        albums: [],
        playlists: [],
        songs: [],
        genres: [],
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
                const [artistItems, albumItems, playlistItems, songs, genreItems] = await Promise.all([
                    api.searchArtists(query, 10),
                    api.searchAlbumsDetailed(query, 10),
                    api.searchPlaylistsDetailed(query, 10),
                    api.fetchSongs(query),
                    api.searchGenres(query, 10),
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

                const genres = genreItems.map(genre => ({
                    type: 'Genre' as const,
                    id: genre.Name,
                    name: genre.Name,
                    _mediaItem: genre,
                }))

                setResults({ artists, albums, playlists, songs, genres })
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
                        <TrackList tracks={results.songs} title={`Search results for '${query}'`} />
                    </div>
                )}

                {results.artists.length > 0 && (
                    <div className="section artists">
                        <div className="title">Artists</div>
                        <MediaList
                            items={results.artists.map(artist => artist._mediaItem)}
                            infiniteData={{
                                pageParams: [1],
                                pages: [results.artists.map(artist => artist._mediaItem)],
                            }}
                            isLoading={loading}
                            type="artist"
                            title={`Artists for '${query}'`}
                            hidden={{ view_artist: true }}
                        />
                    </div>
                )}

                {results.albums.length > 0 && (
                    <div className="section albums">
                        <div className="title">Albums</div>
                        <MediaList
                            items={results.albums.map(album => album._mediaItem)}
                            infiniteData={{ pageParams: [1], pages: [results.albums.map(album => album._mediaItem)] }}
                            isLoading={loading}
                            type="album"
                            title={`Albums for '${query}'`}
                            albumDisplayMode="artist"
                            hidden={{ view_album: true }}
                        />
                    </div>
                )}

                {results.playlists.length > 0 && (
                    <div className="section playlists">
                        <div className="title">Playlists</div>
                        <MediaList
                            items={results.playlists.map(playlist => playlist._mediaItem)}
                            infiniteData={{
                                pageParams: [1],
                                pages: [results.playlists.map(playlist => playlist._mediaItem)],
                            }}
                            isLoading={loading}
                            type="playlist"
                            title={`Playlists for '${query}'`}
                            // hidden={{ view_album: true }}
                        />
                    </div>
                )}

                {results.genres.length > 0 && (
                    <div className="section genres">
                        <div className="title">Genres</div>
                        <div className="section-list noSelect">
                            {results.genres.map(genre => (
                                <Link to={`/genre/${genre.id}`} key={genre.id} className="section-item">
                                    <div className="icon">
                                        <BookmarkFillIcon size={16} />
                                    </div>
                                    <div className="section-info">
                                        <div className="name">{genre.name}</div>
                                    </div>
                                    {genre.isFavorite && (
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
                    results.songs.length === 0 &&
                    results.genres.length === 0 && <div>No results found for '{query}'.</div>}
            </div>
        </div>
    )
}
