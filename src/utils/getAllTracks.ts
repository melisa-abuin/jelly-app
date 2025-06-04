import { InfiniteData } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'

export const getAllTracks = (data: InfiniteData<MediaItem[], unknown> | undefined, allowDuplicates = false) => {
    if (!data) {
        return []
    }

    const flattened = data.pages
        .map((page, pageIndex) =>
            page.map(track => ({
                ...track,
                pageIndex,
            }))
        )
        .flat()

    if (allowDuplicates) {
        return flattened
    }

    const seenIds = new Set<string>()
    return flattened.filter(track => {
        if (seenIds.has(track.Id)) {
            return false
        }
        seenIds.add(track.Id)
        return true
    })
}
