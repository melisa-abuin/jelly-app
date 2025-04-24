import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { getAllTracks } from '../utils/getAllTracks'

export const useJellyfinTracksData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const [sortBy, setSortBy] = useState<ItemSortBy>(ItemSortBy.DateCreated)
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Descending)

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['jellyfinTracks', sortBy, sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getAllTracks(startIndex, itemsPerPage, sortBy, sortOrder)
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
    const allTracks = getAllTracks(data)

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            return getAllTracks((await fetchNextPage()).data)
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const updateSort = useCallback(
        (sortOption: string) => {
            let newSortBy: ItemSortBy
            let newSortOrder: SortOrder = SortOrder.Ascending

            switch (sortOption) {
                case 'Added':
                    newSortBy = ItemSortBy.DateCreated
                    newSortOrder = SortOrder.Descending
                    break
                case 'Released':
                    newSortBy = ItemSortBy.PremiereDate
                    break
                case 'Runtime':
                    newSortBy = ItemSortBy.Runtime
                    break
                case 'Random':
                    newSortBy = ItemSortBy.Random
                    break
                default:
                    newSortBy = ItemSortBy.DateCreated
                    newSortOrder = SortOrder.Descending
            }

            setSortBy(newSortBy)
            setSortOrder(newSortOrder)
            refetch()
        },
        [refetch]
    )

    return {
        allTracks,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
        updateSort,
    }
}
