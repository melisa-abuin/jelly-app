import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/useJellyfinFavoritesData'

const Favorites = () => {
    const { items, isLoading, error } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} isLoading={isLoading} type="song" />
        </div>
    )
}

export default Favorites
