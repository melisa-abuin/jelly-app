import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePatchQueries } from './usePatchQueries'

export const useDownloads = () => {
    const api = useJellyfinContext()
    const { patchMediaItem } = usePatchQueries()

    return {
        addToDownloads: async (itemId: string) => {
            patchMediaItem(itemId, item => {
                return { ...item, isDownloaded: true }
            })
        },
        removeFromDownloads: async (itemId: string) => {
            patchMediaItem(itemId, item => {
                return { ...item, isDownloaded: false }
            })
        },
    }
}
