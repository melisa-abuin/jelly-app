import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

export const useJellyfinPlaylistsFeaturingArtist = (artistId: string) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['playlistsFeaturingArtist', artistId],
        queryFn: async () => {
            return await api.getPlaylistsFeaturingArtist(artistId)
        },
    })

    return {
        playlists: data || [],
        loading: isLoading,
        error: error ? error.message : null,
    }
}
