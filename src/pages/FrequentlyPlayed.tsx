import { MediaList } from '../components/MediaList'
import { useJellyfinFrequentlyPlayedData } from '../hooks/Jellyfin/Infinite/useJellyfinFrequentlyPlayedData'

export const FrequentlyPlayed = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinFrequentlyPlayedData()

    return (
        <div className="frequently-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type="song"
                title={'Frequently Played'}
                reviver={reviver}
                loadMore={loadMore}
            />
        </div>
    )
}
