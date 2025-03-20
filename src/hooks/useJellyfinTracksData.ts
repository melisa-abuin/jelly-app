import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllTracks, MediaItem } from '../api/jellyfin'

interface JellyfinTracksData {
    allTracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
}

export const useJellyfinTracksData = (serverUrl: string, userId: string, token: string) => {
    const [data, setData] = useState<JellyfinTracksData>({
        allTracks: [],
        loading: true,
        error: null,
        hasMore: true,
    })
    const [page, setPage] = useState(0)
    const itemsPerPage = 20
    const seenIds = useRef(new Set<string>())
    const isInitialMount = useRef(true)
    const isLoadingMore = useRef(false)

    useEffect(() => {
        if (isInitialMount.current) {
            setData({
                allTracks: [],
                loading: true,
                error: null,
                hasMore: true,
            })
            setPage(0)
            seenIds.current.clear()
            isInitialMount.current = false
        }
    }, [serverUrl, userId, token])

    useEffect(() => {
        if (!serverUrl || !token) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl or token' }))
            return
        }

        const fetchData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
                const startIndex = page * itemsPerPage
                const tracks = await getAllTracks(serverUrl, userId, token, startIndex, itemsPerPage)

                const newTracks = tracks.filter(track => {
                    if (seenIds.current.has(track.Id)) {
                        return false
                    }
                    seenIds.current.add(track.Id)
                    return true
                })

                setData(prev => {
                    const updatedTracks = [...prev.allTracks, ...newTracks]
                    return {
                        allTracks: updatedTracks,
                        loading: false,
                        error: null,
                        hasMore: tracks.length === itemsPerPage,
                    }
                })
            } catch (error) {
                console.error('Failed to fetch tracks data:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch tracks data' }))
                }
            }
        }

        fetchData()
    }, [serverUrl, userId, token, page])

    const loadMore = useCallback(() => {
        if (isLoadingMore.current) {
            return
        }

        if (!data.loading && data.hasMore) {
            isLoadingMore.current = true
            setPage(prev => {
                const nextPage = prev + 1
                return nextPage
            })
        }
    }, [data.loading, data.hasMore])

    useEffect(() => {
        if (!data.loading) {
            isLoadingMore.current = false
        }
    }, [data.loading])

    // Automatically load more tracks if the user is approaching the end of the current list
    useEffect(() => {
        const checkAndLoadMore = () => {
            if (data.allTracks.length > 0 && data.hasMore && !data.loading) {
                const threshold = 5 // Load more when 5 tracks are left
                if (data.allTracks.length - page * itemsPerPage <= threshold) {
                    loadMore()
                }
            }
        }

        checkAndLoadMore()
    }, [data.allTracks, data.hasMore, data.loading, loadMore, page])

    return { ...data, loadMore }
}
