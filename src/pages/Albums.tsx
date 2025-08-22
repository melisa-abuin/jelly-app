import { MediaList } from '../components/MediaList'
import { useJellyfinAlbumsData } from '../hooks/Jellyfin/Infinite/useJellyfinAlbumsData'

export const Albums = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinAlbumsData()

    return (
        <div className="albums-page">
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type="album"
                title={'Albums'}
                reviver={reviver}
                loadMore={loadMore}
                hidden={{ view_album: true }}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}
