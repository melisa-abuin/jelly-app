import MediaList from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

const Tracks = () => {
    const { items, error } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" />
        </div>
    )
}

export default Tracks
