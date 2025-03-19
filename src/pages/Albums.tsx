import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/useJellyfinAlbumsData'

interface AlbumsProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack?: (track: MediaItem) => void // Optional, not used for albums
    currentTrack?: MediaItem | null // Optional
    isPlaying?: boolean // Optional
    togglePlayPause?: () => void // Optional
}

const Albums = ({ user, serverUrl, token, playTrack, currentTrack, isPlaying, togglePlayPause }: AlbumsProps) => {
    const { allAlbums, loading, error, loadMore, hasMore } = useJellyfinAlbumsData(serverUrl, user.userId, token)

    return (
        <div className="albums-page">
            <MediaList
                items={allAlbums}
                type="album"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={playTrack || (() => {})}
                currentTrack={currentTrack || null}
                isPlaying={isPlaying || false}
                togglePlayPause={togglePlayPause || (() => {})}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
