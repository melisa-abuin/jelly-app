import { useEffect } from 'react'
import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

interface TracksProps {
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

const Tracks = ({
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
}: TracksProps) => {
    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinTracksData(serverUrl, user.userId, token)

    // Update the playlist whenever allTracks changes (e.g., after scrolling)
    useEffect(() => {
        if (allTracks.length > 0) {
            setCurrentPlaylist(allTracks)
        }
    }, [allTracks, setCurrentPlaylist])

    // Pass loadMore and hasMore to App.tsx
    useEffect(() => {
        setLoadMoreCallback(() => loadMore)
        setHasMoreState(hasMore)
    }, [loadMore, hasMore, setLoadMoreCallback, setHasMoreState])

    return (
        <div className="tracks-page">
            <MediaList
                items={allTracks}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    setCurrentPlaylist(allTracks)
                    playTrack(track, index)
                }}
                currentTrack={currentTrack}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                playlist={allTracks}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Tracks
