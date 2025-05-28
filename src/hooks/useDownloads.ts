import { usePatchQueries } from './usePatchQueries'

export const useDownloads = () => {
    const { patchMediaItem } = usePatchQueries()

    return {
        addToDownloads: (itemId: string, finished: boolean | undefined) => {
            patchMediaItem(itemId, item => {
                if (finished === true) {
                    return { ...item, isDownloaded: true, isDownloading: false }
                } else if (finished === false) {
                    return { ...item, isDownloaded: false, isDownloading: true }
                } else {
                    return { ...item, isDownloaded: false, isDownloading: false }
                }
            })
        },
        removeFromDownloads: (itemId: string) => {
            patchMediaItem(itemId, item => {
                return { ...item, isDownloaded: false }
            })
        },
    }
}
