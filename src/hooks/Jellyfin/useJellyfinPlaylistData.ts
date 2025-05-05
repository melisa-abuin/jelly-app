import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { ApiError, MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../../context/PlaybackContext/PlaybackContext'
import { getAllTracks } from '../../utils/getAllTracks'

export const useJellyfinPlaylistData = (playlistId: string) => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const playback = usePlaybackContext()

    const { data: playlist, error: playlistError } = useQuery<MediaItem, ApiError>({
        queryKey: ['playlist', playlistId],
        queryFn: () => api.getPlaylist(playlistId),
    })

    const { data: totals, error: totalsError } = useQuery<
        {
            totalTrackCount: number
            totalPlaytime: number
        },
        ApiError
    >({
        queryKey: ['playlistTotals', playlistId],
        queryFn: () => api.getPlaylistTotals(playlistId),
    })

    const { data, isLoading, isFetched, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['playlistTracks', playlistId],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getPlaylistTracks(playlistId, startIndex, itemsPerPage)
        },
        getNextPageParam: (lastPage, pages) => (lastPage.length === itemsPerPage ? pages.length : undefined),
        initialPageParam: 0,
    })

    useEffect(() => {
        if (
            (error || playlistError || totalsError) instanceof ApiError &&
            (error || playlistError || totalsError)?.response?.status === 401
        ) {
            localStorage.removeItem('auth')
            window.location.href = '/login'
        }
    }, [error, playlistError, totalsError])

    const tracks = useMemo(() => {
        return getAllTracks(data)
    }, [data])

    const loadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            return getAllTracks((await fetchNextPage()).data)
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const totalPlaytime = totals?.totalPlaytime || 0
    const totalTrackCount = totals?.totalTrackCount || 0
    const totalPlays = tracks.reduce((sum, track) => sum + (track.UserData?.PlayCount || 0), 0)

    useEffect(() => {
        if (!isFetched) {
            return
        }

        if (playback.currentPlaylistQueryKey && playback.currentPlaylistQueryKey !== 'playlistTracks') {
            return
        }

        playback.setCurrentPlaylist({
            type: 'playlistTracks',
            playlist: tracks,
            hasMore: Boolean(hasNextPage),
            loadMore,
        })
    }, [
        tracks,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        loadMore,
        isFetched,
        playback.setCurrentPlaylist,
        playback.currentPlaylistQueryKey,
        playback,
    ])

    return {
        playlist,
        items: tracks,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        totalPlaytime,
        totalTrackCount,
        totalPlays,
    }
}
