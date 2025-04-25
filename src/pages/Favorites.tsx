import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

const Favorites = () => {
    const playback = usePlaybackContext()

    const { allFavorites, loading, error, loadMore, hasMore } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={allFavorites}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(allFavorites, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={allFavorites}
            />
        </div>
    )
}

export default Favorites
