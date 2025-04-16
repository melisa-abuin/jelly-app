import { useQuery } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

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

export const useJellyfinArtistData = (artistId: string, trackLimit = 5) => {
    const api = useJellyfinContext()

    const { data, isLoading, error } = useQuery<JellyfinArtistData, Error>({
        queryKey: ['artistData', artistId, trackLimit],
        queryFn: async () => {
            const [artistDetailsResponse, allTracks] = await Promise.all([
                api.getArtistDetails(artistId, trackLimit),
                api.fetchAllTracks(artistId),
            ])

            const { artist, tracks, albums, appearsInAlbums, totalTrackCount } = artistDetailsResponse

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
