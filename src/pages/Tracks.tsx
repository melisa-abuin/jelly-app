import { MediaList } from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/Jellyfin/Infinite/useJellyfinTracksData'

export const Tracks = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                reviver={reviver}
                type="song"
                loadMore={loadMore}
                title={'Tracks'}
            />
        </div>
    )
}
