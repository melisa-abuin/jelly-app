import { useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

interface FavoritesProps {
    user: { userId: string; username: string }
    serverUrl: string
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

const Favorites = ({
    user,
    serverUrl,
    token,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
    setLoadMoreCallback,
    setHasMoreState,
}: FavoritesProps) => {
    const { allFavorites, loading, error, loadMore, hasMore } = useJellyfinFavoritesData(serverUrl, user.userId, token)
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
            if (index >= 0 && allFavorites.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (allFavorites.length > index || !hasMore) {
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
    }, [allFavorites.length, hasMore, loading, loadMore])

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                virtuosoRef={virtuosoRef}
                items={allFavorites}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    setCurrentPlaylist(allFavorites)
                    playTrack(track, index)
                }}
                currentTrack={currentTrack}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                playlist={allFavorites}
            />
        </div>
    )
}

export default Favorites
