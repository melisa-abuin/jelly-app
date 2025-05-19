import { InfiniteData } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'

export const getAllTracks = (data: InfiniteData<MediaItem[], unknown> | undefined) => {
    const seenIds = new Set<string>()
    const allTracks: MediaItem[] = data
        ? data.pages
              .map((page, pageIndex) =>
                  page.map(track => ({
                      ...track,
                      pageIndex,
                  }))
              )
              .flat()
              .filter(track => {
                  if (seenIds.has(track.Id)) {
                      return false
                  }
                  seenIds.add(track.Id)
                  return true
              })
        : []
    return allTracks
}
