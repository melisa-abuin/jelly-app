import { MediaList } from '../components/MediaList'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { useIndexedDbDownloadsData } from '../hooks/useIndexedDbDownloadsData'

export const Downloads = () => {
    const { items, isLoading, error, loadMore } = useIndexedDbDownloadsData()
    const { jellyItemKind } = useFilterContext()

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                infiniteData={{ pageParams: [1], pages: [items] }}
                isLoading={isLoading}
                type={jellyItemKind === 'Audio' ? 'song' : jellyItemKind === 'MusicAlbum' ? 'album' : 'artist'}
                loadMore={loadMore}
                title={'Favorites'}
                disableActions={true}
            />
        </div>
    )
}
