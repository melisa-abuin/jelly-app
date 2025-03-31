import { useQuery } from '@tanstack/react-query'
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
    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['playlists', serverUrl, userId, token],
        queryFn: async () => {
            if (!serverUrl || !userId || !token) {
                throw new Error('Missing authentication details')
            }
            return await getAllPlaylists(serverUrl, userId, token)
        },
        enabled: Boolean(serverUrl && userId && token),
    })

    return {
        playlists: data || [],
        loading: isLoading,
        error: error ? error.message : null,
    }
}
