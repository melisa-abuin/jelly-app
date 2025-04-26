import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

const Favorites = () => {
    const { items, error } = useJellyfinFavoritesData()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" />
        </div>
    )
}

export default Favorites
