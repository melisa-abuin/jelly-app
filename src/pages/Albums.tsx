import MediaList from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/Jellyfin/useJellyfinAlbumsData'

const Albums = () => {
    const { items, error } = useJellyfinAlbumsData()

    return (
        <div className="albums-page">
            <MediaList items={items} type="album" queryKey="albums" />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
