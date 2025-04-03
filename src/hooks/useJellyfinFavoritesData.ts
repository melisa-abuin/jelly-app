import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

export const useJellyfinFavoritesData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['favorites'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getFavoriteTracks(startIndex, itemsPerPage)
        },
        getNextPageParam: (lastPage, pages) => (lastPage.length === itemsPerPage ? pages.length : undefined),
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

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            await fetchNextPage()
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
