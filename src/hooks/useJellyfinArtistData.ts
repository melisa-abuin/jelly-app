import axios from 'axios'
import { useEffect, useState } from 'react'
import { api, getArtistDetails, MediaItem } from '../api/jellyfin'

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

                const allTracksResponse = await api.get<{ Items: MediaItem[] }>(
                    `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Fields=RunTimeTicks,UserData`,
                    { headers: { 'X-Emby-Token': token } }
                )
                const allTracks = allTracksResponse.data.Items
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
            } catch (error) {
                console.error('Failed to fetch artist data:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
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
