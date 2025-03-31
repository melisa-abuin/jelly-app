import { useQuery } from '@tanstack/react-query'
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
    const { data, isLoading, error } = useQuery<MediaItem[], Error>({
        queryKey: ['playlistsFeaturingArtist', serverUrl, userId, token, artistId],
        queryFn: async () => {
            if (!serverUrl || !userId || !token || !artistId) {
                throw new Error('Missing required parameters')
            }
            return await getPlaylistsFeaturingArtist(serverUrl, userId, token, artistId)
        },
        enabled: Boolean(serverUrl && userId && token && artistId),
    })

    return {
        playlists: data || [],
        loading: isLoading,
        error: error ? error.message : null,
    }
}
