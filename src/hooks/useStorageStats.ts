import { useCallback, useEffect, useState } from 'react'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'

interface StorageStats {
    usage: number
    indexedDB: number
}

export const useStorageStats = () => {
    const audioStorage = useAudioStorageContext()
    const [trackCount, setTrackCount] = useState<number>(0)
    const [storageStats, setStorageStats] = useState<StorageStats>({ usage: 0, indexedDB: 0 })

    const loadStats = useCallback(async () => {
        try {
            const count = await audioStorage.getTrackCount()
            setTrackCount(count)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const estimate: any = await navigator.storage?.estimate()
            setStorageStats({
                usage: estimate?.usage || 0,
                indexedDB: estimate?.usageDetails?.indexedDB || 0,
            })
        } catch (error) {
            console.error('Failed to load storage stats:', error)
        }
    }, [audioStorage])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    return { trackCount, storageStats, refreshStorageStats: loadStats }
}
