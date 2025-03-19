import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

interface FavoritesProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
}

const Favorites = ({ user, serverUrl, token, playTrack, currentTrack, isPlaying, togglePlayPause }: FavoritesProps) => {
    const { allFavorites, loading, error, loadMore, hasMore } = useJellyfinFavoritesData(serverUrl, user.userId, token)

    return (
        <div className="favorites-page">
            <MediaList
                items={allFavorites}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={playTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Favorites
