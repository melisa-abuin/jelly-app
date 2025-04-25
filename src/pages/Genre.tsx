import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MediaList from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinGenreTracks } from '../hooks/useJellyfinGenreTracks'

const Genre = () => {
    const playback = usePlaybackContext()

    const { genre } = useParams<{ genre: string }>()
    const { tracks, loading, error, loadMore, hasMore } = useJellyfinGenreTracks(genre!)
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
                items={tracks}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(tracks, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={tracks}
            />
        </div>
    )
}

export default Genre
