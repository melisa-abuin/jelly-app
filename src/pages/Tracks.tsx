import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

const Tracks = () => {
    const playback = usePlaybackContext()

    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={allTracks}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(allTracks, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={allTracks}
            />
        </div>
    )
}

export default Tracks
