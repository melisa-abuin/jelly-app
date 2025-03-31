import { Link } from 'react-router-dom' // Add this import
import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import MediaList from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/useJellyfinHomeData'

interface HomePageProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    currentTrackIndex: number
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
}

const Home = ({
    user,
    serverUrl,
    token,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
}: HomePageProps) => {
    const { recentlyPlayed, frequentlyPlayed, recentlyAdded, loading, error } = useJellyfinHomeData(
        serverUrl,
        user.userId,
        token
    )

    if (loading) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Recently Played</div>
                        <div className="section_desc">Songs you queued up lately</div>
                    </div>
                    <Link to="/recently" className="see-more">
                        See more
                    </Link>
                </div>
                <MediaList
                    items={recentlyPlayed}
                    type="song"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={(track, index) => {
                        setCurrentPlaylist(recentlyPlayed || [])
                        playTrack(track, index)
                    }}
                    currentTrack={currentTrack}
                    currentTrackIndex={currentTrackIndex}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    playlist={recentlyPlayed}
                />
            </div>
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Frequently Played</div>
                        <div className="section_desc">Songs you listen to often</div>
                    </div>
                    <Link to="/frequently" className="see-more">
                        See more
                    </Link>
                </div>
                <MediaList
                    items={frequentlyPlayed}
                    type="song"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={(track, index) => {
                        setCurrentPlaylist(frequentlyPlayed || [])
                        playTrack(track, index)
                    }}
                    currentTrack={currentTrack}
                    currentTrackIndex={currentTrackIndex}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    playlist={frequentlyPlayed}
                />
            </div>
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Recently Added</div>
                        <div className="section_desc">Albums recently added to the Library</div>
                    </div>
                </div>
                <MediaList
                    items={recentlyAdded}
                    type="album"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={(track, index) => {
                        setCurrentPlaylist(recentlyAdded || [])
                        playTrack(track, index)
                    }}
                    currentTrack={currentTrack}
                    currentTrackIndex={currentTrackIndex}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    playlist={recentlyAdded}
                />
            </div>
        </div>
    )
}

export default Home
