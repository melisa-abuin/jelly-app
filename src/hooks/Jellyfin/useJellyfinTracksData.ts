import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { ApiError, MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../../context/PlaybackContext/PlaybackContext'
import { getAllTracks } from '../../utils/getAllTracks'

export const useJellyfinTracksData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const playback = usePlaybackContext()

    const { setCurrentPlaylist } = playback

    const { data, isLoading, isFetched, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['jellyfinTracks', playback.sortBy, playback.sortOrder],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getAllTracks(startIndex, itemsPerPage, playback.sortBy, playback.sortOrder)
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

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            return getAllTracks((await fetchNextPage()).data)
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const allTracks = useMemo(() => {
        return getAllTracks(data)
    }, [data])

    useEffect(() => {
        if (!isFetched) {
            return
        }

        if (playback.currentPlaylistQueryKey && playback.currentPlaylistQueryKey !== 'jellyfinTracks') {
            return
        }

        setCurrentPlaylist({
            type: 'jellyfinTracks',
            playlist: allTracks,
            hasMore: Boolean(hasNextPage),
            loadMore,
        })
    }, [
        allTracks,
        data,
        hasNextPage,
        isFetched,
        isFetchingNextPage,
        isLoading,
        loadMore,
        playback.currentPlaylistQueryKey,
        setCurrentPlaylist,
    ])

    return {
        items: allTracks,
        error: error ? error.message : null,
    }
}
