import { MediaList } from '../components/MediaList'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useJellyfinFavoritesData } from '../hooks/Jellyfin/Infinite/useJellyfinFavoritesData'

export const Favorites = () => {
    const { items, infiniteData, isLoading, error, reviver, loadMore } = useJellyfinFavoritesData()
    const { jellyItemKind } = useFilterContext()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                infiniteData={infiniteData}
                isLoading={isLoading}
                type={jellyItemKind === 'Audio' ? 'song' : jellyItemKind === 'MusicAlbum' ? 'album' : 'artist'}
                reviver={reviver}
                loadMore={loadMore}
                title={'Favorites'}
            />
        </div>
    )
}
