import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

interface TracksProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
}

const Tracks = ({ user, serverUrl, token, playTrack, currentTrack, isPlaying, togglePlayPause }: TracksProps) => {
    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinTracksData(serverUrl, user.userId, token)

    return (
        <div className="tracks-page">
            <MediaList
                items={allTracks}
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

export default Tracks
