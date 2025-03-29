import { useEffect, useState } from 'react'
import { MediaItem, getPlaylistsFeaturingArtist } from '../api/jellyfin'

interface JellyfinPlaylistsFeaturingArtistData {
    playlists: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinPlaylistsFeaturingArtist = (
    serverUrl: string,
    userId: string,
    token: string,
    artistId: string
): JellyfinPlaylistsFeaturingArtistData => {
    const [playlists, setPlaylists] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                setLoading(true)
                const playlistsData = await getPlaylistsFeaturingArtist(serverUrl, userId, token, artistId)
                setPlaylists(playlistsData)
            } catch (err) {
                setError((err as Error).message || 'Failed to fetch playlists')
            } finally {
                setLoading(false)
            }
        }

        fetchPlaylists()
    }, [serverUrl, userId, token, artistId])

    return { playlists, loading, error }
}
