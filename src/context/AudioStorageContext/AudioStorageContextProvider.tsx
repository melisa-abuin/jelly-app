import { ReactNode, useCallback, useEffect, useRef } from 'react'
import { AudioStorageContext } from './AudioStorageContext'

export type IAudioStorageContext = ReturnType<typeof useInitialState>
type IStorageTrack = true | Blob // Blob is the audio file for songs, true is for the album/artist item itself

const useInitialState = () => {
    const dbRef = useRef<Promise<IDBDatabase> | null>(null)

    useEffect(() => {
        const DB_NAME = 'OfflineAudioDB'
        const STORE_NAME = 'tracks'
        const DB_VERSION = 1

        let cancelled = false

        const openDB = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onupgradeneeded = () => {
                const upgradeDb = request.result
                if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                    upgradeDb.createObjectStore(STORE_NAME)
                }
            }

            request.onsuccess = () => {
                if (cancelled) {
                    request.result.close()
                    return
                }

                resolve(request.result)
            }

            request.onerror = () => {
                console.error('IndexedDB error:', request.error)
                reject(request.error)
            }
        })

        dbRef.current = openDB

        return () => {
            cancelled = true
            dbRef.current?.then(db => db.close())
        }
    }, [])

    const saveTrack = useCallback(async (id: string, blob: IStorageTrack) => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction('tracks', 'readwrite')
        tx.objectStore('tracks').put(blob, id)
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        })
    }, [])

    const removeTrack = useCallback(async (id: string) => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction('tracks', 'readwrite')
        tx.objectStore('tracks').delete(id)
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        })
    }, [])

    const getTrack = useCallback(async (id: string): Promise<IStorageTrack | null> => {
        if (!dbRef.current) throw new Error('Database not initialized')
        const db = await dbRef.current
        const tx = db.transaction('tracks', 'readonly')
        const request = tx.objectStore('tracks').get(id)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(request.error)
        })
    }, [])

    const hasTrack = useCallback(
        async (id: string) => {
            const track = await getTrack(id)
            return track !== null
        },
        [getTrack]
    )

    const getPlayableUrl = useCallback(
        async (id: string) => {
            const blob = await getTrack(id)
            return blob && blob !== true ? URL.createObjectURL(blob) : undefined
        },
        [getTrack]
    )

    const audioStorage = { saveTrack, removeTrack, getTrack, hasTrack, getPlayableUrl }

    // We need the audioStorage in jellyfin API but we don't want to cause unnecessary re-renders since opening the IndexedDB shouldn't take long
    window.audioStorage = audioStorage

    return audioStorage
}

export const AudioStorageContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <AudioStorageContext.Provider value={initialState}>{children}</AudioStorageContext.Provider>
}
