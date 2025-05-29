import { useEffect, useRef, useState } from 'react'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { usePatchQueries } from './usePatchQueries'

const STORAGE_KEY = 'mediaTaskQueue'

type Task = { id: string; action: 'download' | 'remove' }

export const useDownloads = () => {
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const audioStorage = useAudioStorageContext()
    const { patchMediaItem } = usePatchQueries()

    const [queue, setQueue] = useState<Task[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? (JSON.parse(stored) as Task[]) : []
        } catch (e) {
            console.error('Failed to load media task queue:', e)
            return []
        }
    })

    const processingRef = useRef(false)

    // Persist queue
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
        } catch (e) {
            console.error('Failed to save media task queue:', e)
        }
    }, [queue])

    // Enqueue download
    const addToDownloads = (itemId: string) => {
        patchMediaItem(itemId, item => ({ ...item, isDownloaded: false, isDownloading: true }))
        setQueue(prev => {
            if (prev.some(task => task.id === itemId && task.action === 'download')) return prev
            return [...prev, { id: itemId, action: 'download' }]
        })
    }

    // Enqueue removal
    const removeFromDownloads = (itemId: string) => {
        patchMediaItem(itemId, item => ({ ...item, isDownloading: false, isDownloaded: true })) // Should be isDeleting
        setQueue(prev => {
            if (prev.some(task => task.id === itemId && task.action === 'remove')) return prev
            return [...prev, { id: itemId, action: 'remove' }]
        })
    }

    // Process queue tasks one at a time
    useEffect(() => {
        const runNext = async () => {
            if (processingRef.current) return
            const next = queue[0]
            if (!next) return

            processingRef.current = true
            const { id, action } = next

            try {
                if (action === 'download') {
                    const streamUrl = api.getStreamUrl(id, playback.bitrate)
                    const response = await fetch(streamUrl)
                    if (!response.ok) throw new Error(`HTTP ${response.status}`)
                    const blob = await response.blob()
                    await audioStorage.saveTrack(id, blob)
                    patchMediaItem(id, item => ({ ...item, isDownloaded: true, isDownloading: false }))
                } else if (action === 'remove') {
                    await audioStorage.removeTrack(id)
                    patchMediaItem(id, item => ({ ...item, isDownloaded: false, isDownloading: false }))
                }
            } catch (error) {
                console.error(`Task failed for ${action} id=${id}`, error)
                // Reset flags if needed
                if (action === 'download') {
                    patchMediaItem(id, item => ({ ...item, isDownloading: false }))
                }
            } finally {
                setQueue(prev => prev.slice(1))
                processingRef.current = false
            }
        }

        runNext()
    }, [api, audioStorage, patchMediaItem, playback.bitrate, queue])

    return { queue, addToDownloads, removeFromDownloads }
}
