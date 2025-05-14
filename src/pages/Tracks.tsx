import MediaList from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/Jellyfin/useJellyfinTracksData'

const Tracks = () => {
    const { items, isLoading, error } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} isLoading={isLoading} type="song" />
        </div>
    )
}

export default Tracks
