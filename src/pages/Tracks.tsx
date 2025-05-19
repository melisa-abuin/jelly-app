import { MediaList } from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/Jellyfin/Infinite/useJellyfinTracksData'

export const Tracks = () => {
    const { items, isLoading, error, reviver, loadMore } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                isLoading={isLoading}
                reviver={reviver}
                type="song"
                loadMore={loadMore}
                title={''}
            />
        </div>
    )
}
