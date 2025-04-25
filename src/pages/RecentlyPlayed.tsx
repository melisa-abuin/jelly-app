import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinRecentlyPlayedData } from '../hooks/useJellyfinRecentlyPlayedData'

const RecentlyPlayed = () => {
    const playback = usePlaybackContext()

    const { items, loading, error, loadMore, hasMore } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(items, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={items}
            />
        </div>
    )
}

export default RecentlyPlayed
