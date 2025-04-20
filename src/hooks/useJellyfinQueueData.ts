import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { getAllTracks } from '../utils/getAllTracks'

export const useJellyfinQueueData = () => {
    const playback = usePlaybackContext()
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const [tracks, setTracks] = useState<MediaItem[]>([])

    const { data: playlistMetadata, isLoading: isMetadataLoading } = useQuery({
        queryKey: ['playlistMetadata', playback.currentTrack?.ParentId],
        queryFn: () => api.fetchPlaylistMetadata(playback.currentTrack!.ParentId!),
        enabled: !!playback.currentTrack?.ParentId,
    })

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<MediaItem[], Error>({
        queryKey: ['queueTracks', playback.currentTrack?.ParentId, playback.currentPlaylist.length],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            if (playback.currentTrack?.ParentId) {
                const result = await api.getPlaylistTracks(playback.currentTrack.ParentId, startIndex, itemsPerPage)
                console.log('Fetched playlist tracks:', { startIndex, count: result.length })
                return result
            }
            const result = playback.currentPlaylist.slice(startIndex, startIndex + itemsPerPage)
            console.log('Sliced custom playlist:', { startIndex, count: result.length })
            return result
        },
        getNextPageParam: (_, pages) => {
            const totalFetched = pages.reduce((sum, page) => sum + page.length, 0)
            const hasMore: boolean = playback.currentTrack?.ParentId
                ? isMetadataLoading ||
                  (playlistMetadata ? totalFetched < playlistMetadata.TotalRecordCount : totalFetched < itemsPerPage)
                : playback.hasMoreState || totalFetched < playback.currentPlaylist.length
            console.log('getNextPageParam:', {
                totalFetched,
                total: playlistMetadata?.TotalRecordCount,
                playlistLength: playback.currentPlaylist.length,
                hasMoreState: playback.hasMoreState,
                isMetadataLoading,
                hasMore,
            })
            return hasMore ? pages.length : undefined
        },
        initialPageParam: 0,
        enabled: playback.currentPlaylist.length > 0 || !!playback.currentTrack?.ParentId,
    })

    useEffect(() => {
        const allTracks = getAllTracks(data)
        // Exclude currentTrack by starting at currentTrackIndex + 1
        const filteredTracks = allTracks.filter((_, index) => index > playback.currentTrackIndex)
        setTracks(filteredTracks)
        if (allTracks.length > 0 && allTracks.length !== playback.currentPlaylist.length) {
            playback.setCurrentPlaylist(allTracks, hasNextPage, loadMore)
        }
    }, [data, playback.currentTrackIndex, playback.currentPlaylist.length, hasNextPage, playback])

    const loadMore = async () => {
        console.log('loadMore called:', { hasNextPage, isFetchingNextPage })
        if (hasNextPage && !isFetchingNextPage) {
            const result = await fetchNextPage()
            return getAllTracks(result.data)
        }
        return undefined
    }

    return {
        tracks,
        loading: isLoading || isFetchingNextPage,
        loadMore,
        hasMore: Boolean(hasNextPage),
    }
}
