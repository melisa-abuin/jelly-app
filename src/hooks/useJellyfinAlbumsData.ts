import axios from 'axios'
import { useEffect, useState } from 'react'
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

    useEffect(() => {
        if (!serverUrl || !token) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl or token' }))
            return
        }

        const fetchData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
                console.log(`Fetching albums data from Jellyfin (page ${page})...`)
                const albums = await getAllAlbums(serverUrl, userId, token, page * itemsPerPage, itemsPerPage)

                setData(prev => ({
                    allAlbums: [...prev.allAlbums, ...albums],
                    loading: false,
                    error: null,
                    hasMore: albums.length === itemsPerPage,
                }))
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

    const loadMore = () => {
        if (!data.loading && data.hasMore) {
            setPage(prev => prev + 1)
        }
    }

    return { ...data, loadMore }
}
