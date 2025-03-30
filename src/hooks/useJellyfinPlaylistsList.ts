import { useEffect, useState } from 'react'
import { getAllPlaylists, MediaItem } from '../api/jellyfin'

interface useJellyfinPlaylistsList {
    playlists: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinPlaylistsList = (
    serverUrl: string,
    userId: string,
    token: string
): useJellyfinPlaylistsList => {
    const [playlists, setPlaylists] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!serverUrl || !userId || !token) {
            setError('Missing authentication details')
            return
        }

        const fetchPlaylists = async () => {
            setLoading(true)
            try {
                const fetchedPlaylists = await getAllPlaylists(serverUrl, userId, token)
                setPlaylists(fetchedPlaylists)
                setError(null)
            } catch (err) {
                console.error('Failed to fetch playlists:', err)
                setError('Failed to load playlists')
            } finally {
                setLoading(false)
            }
        }

        fetchPlaylists()
    }, [serverUrl, userId, token])

    return { playlists, loading, error }
}
