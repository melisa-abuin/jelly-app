import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllAlbums, MediaItem } from '../api/jellyfin'

interface JellyfinAlbumsData {
    allAlbums: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
}

export const useJellyfinAlbumsData = (serverUrl: string, userId: string, token: string) => {
    const [data, setData] = useState<JellyfinAlbumsData>({
        allAlbums: [],
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
                allAlbums: [],
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
                const albums = await getAllAlbums(serverUrl, userId, token, startIndex, itemsPerPage)

                const newAlbums = albums.filter(album => {
                    if (seenIds.current.has(album.Id)) {
                        return false
                    }
                    seenIds.current.add(album.Id)
                    return true
                })

                setData(prev => {
                    const updatedAlbums = [...prev.allAlbums, ...newAlbums]
                    return {
                        allAlbums: updatedAlbums,
                        loading: false,
                        error: null,
                        hasMore: albums.length === itemsPerPage,
                    }
                })
            } catch (error) {
                console.error('Failed to fetch albums data:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch albums data' }))
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

    return { ...data, loadMore }
}
