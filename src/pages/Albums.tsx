import MediaList from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/Jellyfin/useJellyfinAlbumsData'

const Albums = () => {
    const { items, isLoading, error } = useJellyfinAlbumsData()

    return (
        <div className="albums-page">
            <MediaList items={items} isLoading={isLoading} type="album" />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
