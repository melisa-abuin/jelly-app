import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, getFavoriteTracks, MediaItem } from '../api/jellyfin'

interface JellyfinFavoritesData {
    allFavorites: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
}

export const useJellyfinFavoritesData = (serverUrl: string, userId: string, token: string): JellyfinFavoritesData => {
    const itemsPerPage = 40

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['favorites', serverUrl, userId, token],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await getFavoriteTracks(serverUrl, userId, token, startIndex, itemsPerPage)
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
    const allFavorites: MediaItem[] = data
        ? data.pages.flat().filter(favorite => {
              if (seenIds.has(favorite.Id)) {
                  return false
              }
              seenIds.add(favorite.Id)
              return true
          })
        : []

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return {
        allFavorites,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
    }
}
