import axios from 'axios'
import { useEffect, useState } from 'react'
import { getAlbumDetails, MediaItem } from '../api/jellyfin'

interface JellyfinAlbumData {
    album: MediaItem | null
    tracks: MediaItem[]
    loading: boolean
    error: string | null
}

export const useJellyfinAlbumData = (serverUrl: string, userId: string, token: string, albumId: string) => {
    const [data, setData] = useState<JellyfinAlbumData>({
        album: null,
        tracks: [],
        loading: true,
        error: null,
    })

    useEffect(() => {
        if (!serverUrl || !token || !albumId) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl, token, or albumId' }))
            return
        }

        const fetchData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))
            try {
                const { album, tracks } = await getAlbumDetails(serverUrl, userId, token, albumId)
                setData({
                    album,
                    tracks,
                    loading: false,
                    error: null,
                })
            } catch (error) {
                console.error('Failed to fetch album data:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth')
                    window.location.href = '/login'
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch album data' }))
                }
            }
        }

        fetchData()
    }, [serverUrl, userId, token, albumId])

    return data
}
