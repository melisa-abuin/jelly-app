import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/useJellyfinAlbumsData'

interface AlbumsProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack?: (track: MediaItem, index: number) => void
    currentTrack?: MediaItem | null
    currentTrackIndex?: number
    isPlaying?: boolean
    togglePlayPause?: () => void
}

const Albums = ({
    user,
    serverUrl,
    token,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
}: AlbumsProps) => {
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
                currentTrackIndex={currentTrackIndex || -1}
                isPlaying={isPlaying || false}
                togglePlayPause={togglePlayPause || (() => {})}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
