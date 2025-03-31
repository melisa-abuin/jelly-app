import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, MediaItem, fetchFrequentlyPlayed } from '../api/jellyfin'

interface JellyfinFrequentlyPlayedData {
    items: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
}

export const useJellyfinFrequentlyPlayedData = (
    serverUrl: string,
    userId: string,
    token: string
): JellyfinFrequentlyPlayedData => {
    const itemsPerPage = 40

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['frequentlyPlayed', serverUrl, userId, token],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await fetchFrequentlyPlayed(serverUrl, userId, token, startIndex, itemsPerPage)
        },
        getNextPageParam: (lastPage, pages) => (lastPage.length === itemsPerPage ? pages.length : undefined),
        enabled: Boolean(serverUrl && token),
        initialPageParam: 0,
    })

    useEffect(() => {
        if (error instanceof ApiError && error.response?.status === 401) {
            localStorage.removeItem('auth')
            window.location.href = '/login'
        }
    }, [error])

    const seenIds = new Set<string>()
    const items: MediaItem[] = data
        ? data.pages.flat().filter(item => {
              if (!item.Artists || !item.Album || seenIds.has(item.Id)) {
                  return false
              }
              seenIds.add(item.Id)
              return true
          })
        : []

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return {
        items,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
    }
}
