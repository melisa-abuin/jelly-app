import { Link } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { useJellyfinArtistsData } from '../hooks/Jellyfin/Infinite/useJellyfinArtistsData'

export const Artists = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinArtistsData()

    return (
        <div className="artists-page">
            <div className="album-artists">
                <Link to="/albumartists" className="textlink">
                    View album artists
                </Link>
            </div>
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type="artist"
                title={'Artists'}
                reviver={reviver}
                loadMore={loadMore}
                hidden={{ view_artist: true }}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
