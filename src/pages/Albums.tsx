import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext'
import { useJellyfinAlbumsData } from '../hooks/useJellyfinAlbumsData'

const Albums = () => {
    const playback = usePlaybackContext()
    const { allAlbums, loading, error, loadMore, hasMore } = useJellyfinAlbumsData()

    return (
        <div className="albums-page">
            <MediaList
                items={allAlbums}
                type="album"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={playback.playTrack}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
