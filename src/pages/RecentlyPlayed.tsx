import MediaList from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/Jellyfin/useJellyfinRecentlyPlayedData'

const RecentlyPlayed = () => {
    const { items, error } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" queryKey="recentlyPlayed" />
        </div>
    )
}

export default RecentlyPlayed
