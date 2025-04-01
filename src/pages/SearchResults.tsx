import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MediaItem, searchAlbumsDetailed, searchArtistsDetailed, searchPlaylistsDetailed } from '../api/jellyfin'
import { usePageTitle } from '../App'
import Loader from '../components/Loader'
import TrackList from '../components/TrackList'

interface SearchResult {
    type: 'Artist' | 'Album' | 'Playlist' | 'Song'
    id: string
    name: string
    thumbnailUrl?: string
    artists?: string[]
    totalTracks?: number
}

interface SearchResultsProps {
    serverUrl: string
    token: string
    userId: string
    playTrack: (track: MediaItem, index: number) => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
}

const SearchResults: React.FC<SearchResultsProps> = ({
    serverUrl,
    token,
    userId,
    playTrack,
    setCurrentPlaylist,
    currentTrack,
    isPlaying,
    togglePlayPause,
}) => {
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
            if (!query || !serverUrl || !token || !userId) return

            setLoading(true)
            setError(null)

            try {
                const artistItems = await searchArtistsDetailed(serverUrl, userId, token, query, 50)
                const albumItems = await searchAlbumsDetailed(serverUrl, userId, token, query, 50)
                const playlistItems = await searchPlaylistsDetailed(serverUrl, userId, token, query, 50)
                const songResponse = await fetch(
                    `${serverUrl}/Users/${userId}/Items?searchTerm=${encodeURIComponent(
                        query
                    )}&IncludeItemTypes=Audio&Recursive=true&Limit=10&Fields=ArtistItems&api_key=${token}`
                )
                const songData = await songResponse.json()
                const songs = songData.Items || []

                const artists = artistItems.map(artist => ({
                    type: 'Artist' as const,
                    id: artist.Id,
                    name: artist.Name,
                    thumbnailUrl: artist.ImageTags?.Primary
                        ? `${serverUrl}/Items/${artist.Id}/Images/Primary?tag=${artist.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${token}`
                        : '/default-thumbnail.png',
                }))

                const albums = albumItems.map(item => ({
                    type: 'Album' as const,
                    id: item.Id,
                    name: item.Name,
                    thumbnailUrl: item.ImageTags?.Primary
                        ? `${serverUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${token}`
                        : item.AlbumPrimaryImageTag && item.AlbumId
                        ? `${serverUrl}/Items/${item.AlbumId}/Images/Primary?tag=${item.AlbumPrimaryImageTag}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${token}`
                        : '/default-thumbnail.png',
                    artists: item.AlbumArtists?.map(artist => artist.Name) || [item.AlbumArtist || 'Unknown Artist'],
                }))

                const playlists = playlistItems.map(playlist => ({
                    type: 'Playlist' as const,
                    id: playlist.Id,
                    name: playlist.Name,
                    thumbnailUrl: playlist.ImageTags?.Primary
                        ? `${serverUrl}/Items/${playlist.Id}/Images/Primary?tag=${playlist.ImageTags.Primary}&quality=100&fillWidth=46&fillHeight=46&format=webp&api_key=${token}`
                        : '/default-thumbnail.png',
                    totalTracks: playlist.ChildCount || 0,
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
    }, [query, serverUrl, token, userId, setPageTitle])

    if (loading) return <Loader />
    if (error) return <div>{error}</div>
    if (!query) return <div>Enter a search query to see results.</div>

    return (
        <div className="search-results">
            {results.songs.length > 0 && (
                <div className="section songs">
                    <h2>Songs</h2>
                    <TrackList
                        tracks={results.songs}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        togglePlayPause={togglePlayPause}
                        setCurrentPlaylist={setCurrentPlaylist}
                        playTrack={playTrack}
                        showAlbumLink={true}
                    />
                </div>
            )}

            {results.artists.length > 0 && (
                <div className="section artists">
                    <h2>Artists</h2>
                    <ul>
                        {results.artists.map(artist => (
                            <li key={artist.id} className="search-item">
                                {artist.thumbnailUrl && (
                                    <img src={artist.thumbnailUrl} alt={artist.name} className="thumbnail" />
                                )}
                                <Link to={`/artist/${artist.id}`}>{artist.name}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {results.albums.length > 0 && (
                <div className="section albums">
                    <h2>Albums</h2>
                    <ul>
                        {results.albums.map(album => (
                            <li key={album.id} className="search-item">
                                {album.thumbnailUrl && (
                                    <img src={album.thumbnailUrl} alt={album.name} className="thumbnail" />
                                )}
                                <div>
                                    <Link to={`/album/${album.id}`}>{album.name}</Link>
                                    <span className="album-artists">
                                        {album.artists?.join(', ') || 'Unknown Artist'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {results.playlists.length > 0 && (
                <div className="section playlists">
                    <h2>Playlists</h2>
                    <ul>
                        {results.playlists.map(playlist => (
                            <li key={playlist.id} className="search-item">
                                {playlist.thumbnailUrl && (
                                    <img src={playlist.thumbnailUrl} alt={playlist.name} className="thumbnail" />
                                )}
                                <div>
                                    <Link to={`/playlist/${playlist.id}`}>{playlist.name}</Link>
                                    <span className="playlist-tracks">{playlist.totalTracks} tracks</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {results.artists.length === 0 &&
                results.albums.length === 0 &&
                results.playlists.length === 0 &&
                results.songs.length === 0 && <div>No results found for '{query}'.</div>}
        </div>
    )
}

export default SearchResults
