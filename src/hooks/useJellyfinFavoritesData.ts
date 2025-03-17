import axios from 'axios'
import { useEffect, useState } from 'react'
import { getFavoriteTracks, MediaItem } from '../api/jellyfin'

interface JellyfinFavoritesData {
    favoriteTracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
}

export const useJellyfinFavoritesData = (serverUrl: string, userId: string, token: string) => {
    const [data, setData] = useState<JellyfinFavoritesData>({
        favoriteTracks: [],
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
                console.log(`Fetching favorite tracks from Jellyfin (page ${page})...`)
                const favorites = await getFavoriteTracks(serverUrl, userId, token, page * itemsPerPage, itemsPerPage)

                setData(prev => ({
                    favoriteTracks: [...prev.favoriteTracks, ...favorites],
                    loading: false,
                    error: null,
                    hasMore: favorites.length === itemsPerPage,
                }))
            } catch (error) {
                console.error('Failed to fetch favorite tracks:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch favorite tracks' }))
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
