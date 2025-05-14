import MediaList from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/Jellyfin/useJellyfinRecentlyPlayedData'

const RecentlyPlayed = () => {
    const { items, isLoading, error } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} isLoading={isLoading} type="song" />
        </div>
    )
}

export default RecentlyPlayed
