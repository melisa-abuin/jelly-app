import { useEffect, useState } from 'react'
import { ApiError, fetchAllTracks, getArtistDetails, MediaItem } from '../api/jellyfin'

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
): JellyfinArtistData => {
    const [data, setData] = useState<JellyfinArtistData>({
        artist: null,
        tracks: [],
        albums: [],
        appearsInAlbums: [],
        totalTrackCount: 0,
        totalPlaytime: 0,
        totalPlays: 0,
        loading: true,
        error: null,
    })

    useEffect(() => {
        if (!serverUrl || !token || !artistId) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl, token, or artistId' }))
            return
        }

        const fetchArtistData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
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

                setData({
                    artist,
                    tracks,
                    albums,
                    appearsInAlbums,
                    totalTrackCount,
                    totalPlaytime,
                    totalPlays,
                    loading: false,
                    error: null,
                })
            } catch (err) {
                console.error('Failed to fetch artist data:', err)
                if (err instanceof ApiError && err.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch artist data' }))
                }
            }
        }

        fetchArtistData()
    }, [serverUrl, userId, token, artistId, trackLimit])

    return data
}
