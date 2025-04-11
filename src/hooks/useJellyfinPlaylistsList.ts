import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

export const useJellyfinPlaylistsList = () => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['playlists'],
        queryFn: async () => {
            return await api.getAllPlaylists()
        },
    })

    return {
        playlists: data || [],
        loading: isLoading,
        error: error ? error.message : null,
    }
}
