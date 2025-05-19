import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinGenreTracks } from '../hooks/Jellyfin/Infinite/useJellyfinGenreTracks'

export const Genre = () => {
    const { genre } = useParams<{ genre: string }>()
    const { items, isLoading, error, reviver, loadMore } = useJellyfinGenreTracks(genre!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (genre) {
            setPageTitle(decodeURIComponent(genre))
        }
        return () => {
            setPageTitle('')
        }
    }, [genre, setPageTitle])

    return (
        <div className="genre-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                items={items}
                isLoading={isLoading}
                type="song"
                title={''}
                reviver={reviver}
                loadMore={loadMore}
            />
        </div>
    )
}
