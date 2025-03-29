import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getGenreTracks, MediaItem } from '../api/jellyfin'

interface JellyfinGenreTracksData {
    tracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
}

export const useJellyfinGenreTracks = (
    serverUrl: string,
    userId: string,
    token: string,
    genre: string
): JellyfinGenreTracksData => {
    const [data, setData] = useState<JellyfinGenreTracksData>({
        tracks: [],
        loading: true,
        error: null,
        hasMore: true,
        loadMore: () => {},
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
            setData(prev => ({ ...prev, tracks: [], hasMore: true }))
            isInitialMount.current = false
        }
    }, [serverUrl, userId, token, genre])

    useEffect(() => {
        if (!serverUrl || !token || !genre) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl, token, or genre' }))
            return
        }

        const fetchTracks = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
                const startIndex = page * itemsPerPage
                const fetchedTracks = await getGenreTracks(serverUrl, userId, token, genre, startIndex, itemsPerPage)

                const newTracks = fetchedTracks.filter(track => {
                    if (seenIds.current.has(track.Id)) {
                        return false
                    }
                    seenIds.current.add(track.Id)
                    return true
                })

                setData(prev => ({
                    ...prev,
                    tracks: [...prev.tracks, ...newTracks],
                    loading: false,
                    error: null,
                    hasMore: fetchedTracks.length === itemsPerPage,
                }))
            } catch (error) {
                console.error('Failed to fetch genre tracks:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch genre tracks' }))
                }
            }
        }

        fetchTracks()
    }, [serverUrl, userId, token, genre, page])

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
