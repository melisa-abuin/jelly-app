import { useQuery } from '@tanstack/react-query'
import { fetchAllTracks, getArtistDetails, MediaItem } from '../api/jellyfin'

interface JellyfinArtistData {
    artist: MediaItem | null
    tracks: MediaItem[]
    albums: MediaItem[]
    appearsInAlbums: MediaItem[]
    totalTrackCount: number
    totalPlaytime: number
    totalPlays: number
    loading: boolean
    error: string | null
}

export const useJellyfinArtistData = (
    serverUrl: string,
    userId: string,
    token: string,
    artistId: string,
    trackLimit = 5
) => {
    const { data, isLoading, error } = useQuery<JellyfinArtistData, Error>({
        queryKey: ['artistData', serverUrl, userId, token, artistId, trackLimit],
        queryFn: async () => {
            if (!serverUrl || !token || !artistId) {
                throw new Error('No serverUrl, token, or artistId')
            }
            const { artist, tracks, albums, appearsInAlbums, totalTrackCount } = await getArtistDetails(
                serverUrl,
                userId,
                token,
                artistId,
                trackLimit
            )
            const allTracks = await fetchAllTracks(serverUrl, userId, token, artistId)
            const totalPlaytime = allTracks.reduce(
                (sum: number, track: MediaItem) => sum + (track.RunTimeTicks || 0),
                0
            )
            const totalPlays = allTracks.reduce(
                (sum: number, track: MediaItem) => sum + (track.UserData?.PlayCount || 0),
                0
            )
            return {
                artist,
                tracks,
                albums,
                appearsInAlbums,
                totalTrackCount,
                totalPlaytime,
                totalPlays,
                loading: false,
                error: null,
            }
        },
        enabled: Boolean(serverUrl && token && artistId),
    })

    return {
        ...data,
        loading: isLoading,
        error: error ? error.message : null,
        appearsInAlbums: data?.appearsInAlbums || [],
        albums: data?.albums || [],
        tracks: data?.tracks || [],
        totalPlays: data?.totalPlays || 0,
    }
}
