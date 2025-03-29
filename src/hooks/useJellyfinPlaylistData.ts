import { useCallback, useEffect, useRef, useState } from 'react'
import { api, axios, getPlaylist, getPlaylistTracks, MediaItem } from '../api/jellyfin'

interface JellyfinPlaylistData {
    playlist: MediaItem | null
    tracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
    totalPlaytime: number
    totalTrackCount: number
    totalPlays: number
}

export const useJellyfinPlaylistData = (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string
): JellyfinPlaylistData => {
    const [data, setData] = useState<JellyfinPlaylistData>({
        playlist: null,
        tracks: [],
        loading: true,
        error: null,
        hasMore: true,
        loadMore: () => {},
        totalPlaytime: 0,
        totalTrackCount: 0,
        totalPlays: 0,
    })
    const [page, setPage] = useState(0)
    const itemsPerPage = 40
    const seenIds = useRef(new Set<string>())
    const isInitialMount = useRef(true)
    const isLoadingMore = useRef(false)

    useEffect(() => {
        if (isInitialMount.current) {
            setPage(0)
            seenIds.current.clear()
            setData(prev => ({
                ...prev,
                tracks: [],
                hasMore: true,
                totalPlaytime: 0,
                totalTrackCount: 0,
                totalPlays: 0,
            }))
            isInitialMount.current = false

            // Fetch playlist metadata only once
            const fetchPlaylistMetadata = async () => {
                try {
                    const fetchedPlaylist = await getPlaylist(serverUrl, userId, token, playlistId)
                    setData(prev => ({
                        ...prev,
                        playlist: fetchedPlaylist,
                    }))
                } catch (error) {
                    console.error('Failed to fetch playlist metadata:', error)
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch playlist metadata' }))
                }
            }

            fetchPlaylistMetadata()
        }
    }, [serverUrl, userId, token, playlistId])

    useEffect(() => {
        if (!serverUrl || !token || !playlistId) {
            setData(prev => ({ ...prev, loading: false, error: 'No serverUrl, token, or playlistId' }))
            return
        }

        const fetchPlaylistTracks = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
                let totalPlaytime = 0
                let totalTrackCount = 0
                let totalPlays = 0

                const startIndex = page * itemsPerPage

                // Fetch totalResponse only on the first page
                const totalResponse =
                    page === 0
                        ? await api.get<{ Items: MediaItem[]; TotalRecordCount: number }>(
                              `${serverUrl}/Users/${userId}/Items?ParentId=${playlistId}&IncludeItemTypes=Audio&Fields=RunTimeTicks,UserData`,
                              { headers: { 'X-Emby-Token': token } }
                          )
                        : null

                if (totalResponse) {
                    const totalTracks = totalResponse.data.Items
                    totalTrackCount = totalResponse.data.TotalRecordCount
                    totalPlaytime = totalTracks.reduce(
                        (sum: number, track: MediaItem) => sum + (track.RunTimeTicks || 0),
                        0
                    )
                    totalPlays = totalTracks.reduce(
                        (sum: number, track: MediaItem) => sum + (track.UserData?.PlayCount || 0),
                        0
                    )
                }

                // Fetch tracks for the current page
                const fetchedTracks = await getPlaylistTracks(
                    serverUrl,
                    userId,
                    token,
                    playlistId,
                    startIndex,
                    itemsPerPage
                )

                const newTracks = fetchedTracks.filter(track => {
                    if (seenIds.current.has(track.Id)) {
                        return false
                    }
                    seenIds.current.add(track.Id)
                    return true
                })

                // Update state with the fetched data
                setData(prev => ({
                    ...prev,
                    tracks: [...prev.tracks, ...newTracks],
                    loading: false,
                    error: null,
                    hasMore: fetchedTracks.length === itemsPerPage,
                    totalPlaytime: page === 0 ? totalPlaytime : prev.totalPlaytime,
                    totalTrackCount: page === 0 ? totalTrackCount : prev.totalTrackCount,
                    totalPlays: page === 0 ? totalPlays : prev.totalPlays,
                }))
            } catch (error) {
                console.error('Failed to fetch playlist tracks:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch playlist tracks' }))
                }
            }
        }

        fetchPlaylistTracks()
    }, [serverUrl, userId, token, playlistId, page])

    const loadMore = useCallback(() => {
        if (isLoadingMore.current) {
            return
        }

        if (!data.loading && data.hasMore) {
            isLoadingMore.current = true
            setPage(prev => prev + 1)
        }
    }, [data.loading, data.hasMore])

    useEffect(() => {
        if (!data.loading) {
            isLoadingMore.current = false
        }
    }, [data.loading])

    return { ...data, loadMore }
}
