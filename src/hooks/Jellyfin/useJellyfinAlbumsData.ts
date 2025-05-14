import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { ApiError, MediaItem } from '../../api/jellyfin'
import { useFilterContext } from '../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../../context/PlaybackContext/PlaybackContext'
import { getAllTracks } from '../../utils/getAllTracks'

export const useJellyfinAlbumsData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const playback = usePlaybackContext()
    const { jellySort } = useFilterContext()

    const { data, isFetching, isPending, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['albums', jellySort.sortBy, jellySort.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getAllAlbums(startIndex, itemsPerPage, jellySort.sortBy, jellySort.sortOrder)
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

    const allAlbums = useMemo(() => {
        return getAllTracks(data)
    }, [data])

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            return getAllTracks((await fetchNextPage()).data)
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    useEffect(() => {
        playback.setCurrentPlaylist({
            isInfinite: true,
            playlist: allAlbums,
            hasMore: Boolean(hasNextPage),
            loadMore,
        })
    }, [allAlbums, hasNextPage, loadMore, playback])

    return {
        items: allAlbums,
        isLoading: isFetching || isPending,
        error: error ? error.message : null,
    }
}
