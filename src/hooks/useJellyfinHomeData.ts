import { useQuery } from '@tanstack/react-query'
import { getFrequentlyPlayed, getRecentlyAdded, getRecentlyPlayed, MediaItem } from '../api/jellyfin'

interface JellyfinHomeData {
    recentlyPlayed: MediaItem[]
    frequentlyPlayed: MediaItem[]
    recentlyAdded: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinHomeData = (serverUrl: string, userId: string, token: string) => {
    const { data, isLoading, error } = useQuery<JellyfinHomeData, Error>({
        queryKey: ['homeData', serverUrl, userId, token],
        queryFn: async () => {
            if (!serverUrl || !token) {
                throw new Error('No serverUrl or token')
            }
            const [recentlyPlayed, frequentlyPlayed, recentlyAdded] = await Promise.all([
                getRecentlyPlayed(serverUrl, userId, token),
                getFrequentlyPlayed(serverUrl, userId, token),
                getRecentlyAdded(serverUrl, userId, token),
            ])
            return {
                recentlyPlayed: recentlyPlayed.filter(item => item.Type === 'Audio'),
                frequentlyPlayed: frequentlyPlayed.filter(item => item.Type === 'Audio'),
                recentlyAdded: recentlyAdded.filter(item => item.Type === 'MusicAlbum'),
                loading: false,
                error: null,
            }
        },
        enabled: Boolean(serverUrl && token),
    })

    return {
        ...data,
        loading: isLoading,
        error: error ? error.message : null,
    }
}
