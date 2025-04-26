import MediaList from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/useJellyfinRecentlyPlayedData'

const RecentlyPlayed = () => {
    const { items, error } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" />
        </div>
    )
}

export default RecentlyPlayed
