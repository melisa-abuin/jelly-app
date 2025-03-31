import { useQuery } from '@tanstack/react-query'
import { getAlbumDetails, MediaItem } from '../api/jellyfin'

interface JellyfinAlbumData {
    album: MediaItem | null
    tracks: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinAlbumData = (serverUrl: string, userId: string, token: string, albumId: string) => {
    const { data, isLoading, error } = useQuery<JellyfinAlbumData, Error>({
        queryKey: ['albumData', serverUrl, userId, token, albumId],
        queryFn: async () => {
            if (!serverUrl || !token || !albumId) {
                throw new Error('No serverUrl, token, or albumId')
            }
            const { album, tracks } = await getAlbumDetails(serverUrl, userId, token, albumId)
            return {
                album,
                tracks,
                loading: false,
                error: null,
            }
        },
        enabled: Boolean(serverUrl && token && albumId),
    })

    return {
        ...data,
        loading: isLoading,
        error: error ? error.message : null,
        tracks: data?.tracks || [],
    }
}
