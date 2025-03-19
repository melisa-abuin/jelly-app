import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import MediaList from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/useJellyfinHomeData'

interface HomePageProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem) => void
    currentTrack: MediaItem | null
    isPlaying: boolean
    togglePlayPause: () => void
}

const Home = ({ user, serverUrl, token, playTrack, currentTrack, isPlaying, togglePlayPause }: HomePageProps) => {
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
                <div className="section_title">Recently Played</div>
                <div className="section_desc">Songs you queued up lately</div>
                <MediaList
                    items={recentlyPlayed}
                    type="song"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={playTrack}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                />
            </div>
            <div className="section">
                <div className="section_title">Frequently Played</div>
                <div className="section_desc">Songs you listen to often</div>
                <MediaList
                    items={frequentlyPlayed}
                    type="song"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={playTrack}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                />
            </div>
            <div className="section">
                <div className="section_title">Recently Added</div>
                <div className="section_desc">Albums recently added to the Library</div>
                <MediaList
                    items={recentlyAdded}
                    type="album"
                    loading={loading}
                    serverUrl={serverUrl}
                    playTrack={playTrack}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                />
            </div>
        </div>
    )
}

export default Home
