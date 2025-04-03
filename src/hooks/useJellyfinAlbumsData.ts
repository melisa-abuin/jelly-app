import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

export const useJellyfinAlbumsData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['albums'],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getAllAlbums(startIndex, itemsPerPage)
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
    const allAlbums: MediaItem[] = data
        ? data.pages.flat().filter(album => {
              if (seenIds.has(album.Id)) {
                  return false
              }
              seenIds.add(album.Id)
              return true
          })
        : []

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            await fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return {
        allAlbums,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
    }
}
