import { MediaList } from '../components/MediaList'
import { useJellyfinAlbumArtistsData } from '../hooks/Jellyfin/Infinite/useJellyfinAlbumArtistsData'

export const AlbumArtists = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinAlbumArtistsData()

    return (
        <div className="artists-page">
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type="artist"
                title={'Album Artists'}
                reviver={reviver}
                loadMore={loadMore}
                hidden={{ view_artist: true }}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
