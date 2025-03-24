import React, { useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/useJellyfinRecentlyPlayedData'

interface RecentlyPlayedProps {
    serverUrl: string
    userId: string
    token: string
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    currentTrackIndex: number
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
    setLoadMoreCallback: (callback: () => void) => void
    setHasMoreState: (hasMore: boolean) => void
}

const RecentlyPlayed: React.FC<RecentlyPlayedProps> = ({
    serverUrl,
    userId,
    token,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
    setLoadMoreCallback,
    setHasMoreState,
}) => {
    const { items, loading, error, loadMore, hasMore } = useJellyfinRecentlyPlayedData(serverUrl, userId, token)
    const virtuosoRef = useRef<any>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        setLoadMoreCallback(() => loadMore)
        setHasMoreState(hasMore)
    }, [loadMore, hasMore, setLoadMoreCallback, setHasMoreState])

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = parseInt(savedIndex, 10)
            if (index >= 0 && items.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (items.length > index || !hasMore) {
                        setIsPreloading(false)
                        hasPreloaded.current = true
                        return
                    }

                    if (loading) {
                        setTimeout(loadAdditionalTracks, 100)
                        return
                    }

                    await loadMore()
                    setTimeout(loadAdditionalTracks, 100)
                }

                loadAdditionalTracks()
            } else {
                hasPreloaded.current = true
                setIsPreloading(false)
            }
        } else {
            hasPreloaded.current = true
            setIsPreloading(false)
        }
    }, [items.length, hasMore, loading, loadMore])

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                virtuosoRef={virtuosoRef}
                items={items}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    setCurrentPlaylist(items)
                    playTrack(track, index)
                }}
                currentTrack={currentTrack}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                playlist={items}
            />
        </div>
    )
}

export default RecentlyPlayed
