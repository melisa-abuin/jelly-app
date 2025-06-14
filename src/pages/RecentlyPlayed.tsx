import { MediaList } from '../components/MediaList'
import { useJellyfinRecentlyPlayedData } from '../hooks/Jellyfin/Infinite/useJellyfinRecentlyPlayedData'

export const RecentlyPlayed = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinRecentlyPlayedData()

    return (
        <div className="recently-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type="song"
                title={'Recently Played'}
                reviver={reviver}
                loadMore={loadMore}
            />
        </div>
    )
}
