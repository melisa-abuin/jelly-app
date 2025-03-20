import { useEffect } from 'react'
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

    // Update the playlist whenever allFavorites changes (e.g., after scrolling)
    useEffect(() => {
        if (allFavorites.length > 0) {
            setCurrentPlaylist(allFavorites)
        }
    }, [allFavorites, setCurrentPlaylist])

    // Pass loadMore and hasMore to App.tsx
    useEffect(() => {
        setLoadMoreCallback(() => loadMore)
        setHasMoreState(hasMore)
    }, [loadMore, hasMore, setLoadMoreCallback, setHasMoreState])

    return (
        <div className="favorites-page">
            <MediaList
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
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Favorites
