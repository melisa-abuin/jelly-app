import MediaList from '../components/MediaList'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

const Tracks = () => {
    const { error } = useJellyfinTracksData()

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList type="song" />
        </div>
    )
}

export default Tracks
