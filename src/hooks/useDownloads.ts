import { useEffect, useRef, useState } from 'react'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { usePatchQueries } from './usePatchQueries'

const STORAGE_KEY = 'mediaTaskQueue'

type IMediaType = 'song' | 'container'
type Task = { id: string; action: 'download' | 'remove'; mediaType: IMediaType }

export const useDownloads = () => {
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const audioStorage = useAudioStorageContext()
    const { patchMediaItem, patchMediaItems } = usePatchQueries()

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
    const addToDownloads = (itemIds: string[], containerId: string | undefined) => {
        patchMediaItems(itemIds, item => ({ ...item, offlineState: 'downloading' }))

        if (containerId) {
            patchMediaItem(containerId, item => ({ ...item, offlineState: 'downloading' }))
        }

        setQueue(prev => {
            const newTasks = itemIds
                .filter(id => !prev.some(task => task.id === id && task.action === 'download'))
                .map(id => ({ id, action: 'download' as const, mediaType: 'song' as IMediaType }))

            if (containerId) {
                newTasks.push({ id: containerId, action: 'download', mediaType: 'container' as IMediaType })
            }

            return newTasks.length ? [...prev, ...newTasks] : prev
        })
    }

    // Enqueue removal
    const removeFromDownloads = (itemIds: string[], containerId: string | undefined) => {
        patchMediaItems(itemIds, item => ({ ...item, offlineState: 'deleting' }))

        if (containerId) {
            patchMediaItem(containerId, item => ({ ...item, offlineState: 'deleting' }))
        }

        setQueue(prev => {
            const newTasks = itemIds
                .filter(id => !prev.some(task => task.id === id && task.action === 'remove'))
                .map(id => ({ id, action: 'remove' as const, mediaType: 'song' as IMediaType }))

            if (containerId) {
                newTasks.push({ id: containerId, action: 'remove', mediaType: 'container' as IMediaType })
            }

            return newTasks.length ? [...prev, ...newTasks] : prev
        })
    }

    // Process queue tasks one at a time
    useEffect(() => {
        const runNext = async () => {
            if (processingRef.current) return
            const next = queue[0]
            if (!next) return

            processingRef.current = true
            const { id, action, mediaType } = next

            try {
                if (action === 'download') {
                    const already = await audioStorage.hasTrack(id)
                    if (already) {
                        patchMediaItem(id, item => ({ ...item, offlineState: 'downloaded' }))
                    } else {
                        if (mediaType === 'song') {
                            const streamUrl = api.getStreamUrl(id, playback.bitrate)
                            const response = await fetch(streamUrl)
                            if (!response.ok) throw new Error(`HTTP ${response.status}`)
                            const blob = await response.blob()
                            await audioStorage.saveTrack(id, blob)
                        } else {
                            await audioStorage.saveTrack(id, true)
                        }

                        patchMediaItem(id, item => ({ ...item, offlineState: 'downloaded' }))
                    }
                } else if (action === 'remove') {
                    await audioStorage.removeTrack(id)
                    patchMediaItem(id, item => ({ ...item, offlineState: undefined }))
                }
            } catch (error) {
                console.error(`Task failed for ${action} id=${id}`, error)

                if (action === 'download') {
                    patchMediaItem(id, item => ({ ...item, offlineState: undefined }))
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
