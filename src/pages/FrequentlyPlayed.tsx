import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinFrequentlyPlayedData } from '../hooks/useJellyfinFrequentlyPlayedData'

const FrequentlyPlayed = () => {
    const playback = usePlaybackContext()

    const { items, loading, error, loadMore, hasMore } = useJellyfinFrequentlyPlayedData()

    return (
        <div className="frequently-page">
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

export default FrequentlyPlayed
