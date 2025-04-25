import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { ApiError, MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { getAllTracks } from '../utils/getAllTracks'

export const useJellyfinArtistTracksData = (artistId: string) => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const playback = usePlaybackContext()

    const { setCurrentPlaylist } = playback

    const { data, isLoading, isFetched, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['artistTracks', artistId],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            const { Items } = await api.getArtistTracks(artistId, startIndex, itemsPerPage)
            return Items
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

        setCurrentPlaylist({
            playlist: allTracks,
            hasMore: Boolean(hasNextPage),
            loadMore,
        })
    }, [allTracks, data, hasNextPage, isFetched, isFetchingNextPage, isLoading, loadMore, playback, setCurrentPlaylist])

    return {
        allTracks: getAllTracks(data),
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
    }
}
