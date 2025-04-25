import MediaList from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/useJellyfinAlbumsData'

const Albums = () => {
    const { error } = useJellyfinAlbumsData()

    return (
        <div className="albums-page">
            <MediaList type="album" />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Albums
