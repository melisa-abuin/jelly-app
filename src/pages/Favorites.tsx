import { MediaList } from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/Infinite/useJellyfinFavoritesData'

export const Favorites = () => {
    const { items, isLoading, error, reviver, loadMore } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                isLoading={isLoading}
                type="song"
                reviver={reviver}
                loadMore={loadMore}
                title={'Favorites'}
            />
        </div>
    )
}
