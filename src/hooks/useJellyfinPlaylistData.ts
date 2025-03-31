import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { ApiError, getPlaylist, getPlaylistTracks, MediaItem } from '../api/jellyfin'

interface JellyfinPlaylistData {
    playlist: MediaItem | null
    tracks: MediaItem[]
    loading: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
    totalPlaytime: number
    totalTrackCount: number
    totalPlays: number
}

export const useJellyfinPlaylistData = (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string
): JellyfinPlaylistData => {
    const itemsPerPage = 40

    const { data: playlist, error: playlistError } = useQuery<MediaItem, ApiError>({
        queryKey: ['playlist', serverUrl, userId, token, playlistId],
        queryFn: () => getPlaylist(serverUrl, userId, token, playlistId),
        enabled: Boolean(serverUrl && token && playlistId),
    })

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<
        MediaItem[],
        ApiError
    >({
        queryKey: ['playlistTracks', serverUrl, userId, token, playlistId],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await getPlaylistTracks(serverUrl, userId, token, playlistId, startIndex, itemsPerPage)
        },
        getNextPageParam: (lastPage, pages) => (lastPage.length === itemsPerPage ? pages.length : undefined),
        enabled: Boolean(serverUrl && token && playlistId),
        initialPageParam: 0,
    })

    useEffect(() => {
        if ((error || playlistError) instanceof ApiError && (error || playlistError)?.response?.status === 401) {
            localStorage.removeItem('auth')
            window.location.href = '/login'
        }
    }, [error, playlistError])

    const seenIds = new Set<string>()
    const tracks: MediaItem[] = data
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

    const totalPlaytime = tracks.reduce((sum, track) => sum + (track.RunTimeTicks || 0), 0)
    const totalTrackCount = tracks.length
    const totalPlays = tracks.reduce((sum, track) => sum + (track.UserData?.PlayCount || 0), 0)

    return {
        playlist: playlist || null,
        tracks,
        loading: isLoading || isFetchingNextPage,
        error: error ? error.message : null,
        hasMore: Boolean(hasNextPage),
        loadMore,
        totalPlaytime,
        totalTrackCount,
        totalPlays,
    }
}
