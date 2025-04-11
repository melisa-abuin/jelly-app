import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

interface JellyfinAlbumData {
    album: MediaItem | null
    tracks: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinAlbumData = (albumId: string) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<JellyfinAlbumData, Error>({
        queryKey: ['albumData', albumId],
        queryFn: async () => {
            const { album, tracks } = await api.getAlbumDetails(albumId)

            return {
                album,
                tracks,
                loading: false,
                error: null,
            }
        },
    })

    return {
        ...data,
        loading: isLoading,
        error: error ? error.message : null,
        tracks: data?.tracks || [],
    }
}
