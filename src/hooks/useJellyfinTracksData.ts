import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

interface JellyfinTracksData {
    allTracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
}

export const useJellyfinTracksData = (): JellyfinTracksData => {
    const api = useJellyfinContext()
    const itemsPerPage = 40

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['jellyfinTracks'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getAllTracks(startIndex, itemsPerPage)
        },
        getNextPageParam: (lastPage, pages) => (lastPage.length === itemsPerPage ? pages.length : undefined),
        initialPageParam: 0,
    })

    useEffect(() => {
        if (error instanceof ApiError) {
            if (error.response?.status === 401) {
                localStorage.removeItem('auth')
                window.location.href = '/login'
            }
        }
    }, [error])

    // Combine pages and filter out any duplicate tracks using a Set.
    const seenIds = new Set<string>()
    const allTracks: MediaItem[] = data
        ? data.pages.flat().filter(track => {
              if (seenIds.has(track.Id)) {
                  return false
              }
              seenIds.add(track.Id)
              return true
          })
        : []

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return {
        allTracks,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
    }
}
