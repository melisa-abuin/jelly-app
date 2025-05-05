import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/useJellyfinFavoritesData'

const Favorites = () => {
    const { items, error } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" queryKey="favorites" />
        </div>
    )
}

export default Favorites
