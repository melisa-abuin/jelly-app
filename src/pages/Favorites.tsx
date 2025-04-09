import { useEffect, useRef, useState } from 'react'
import { VirtuosoHandle } from 'react-virtuoso'
import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

const Favorites = () => {
    const playback = usePlaybackContext()

    const { allFavorites, loading, error, loadMore, hasMore } = useJellyfinFavoritesData()
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = Number(savedIndex)
            if (index >= 0 && allFavorites.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (allFavorites.length > index || !hasMore) {
                        setIsPreloading(false)
                        hasPreloaded.current = true
                        return
                    }

                    if (loading) {
                        setTimeout(loadAdditionalTracks, 100)
                        return
                    }

                    await loadMore()
                    setTimeout(loadAdditionalTracks, 100)
                }

                loadAdditionalTracks()
            } else {
                hasPreloaded.current = true
                setIsPreloading(false)
            }
        } else {
            hasPreloaded.current = true
            setIsPreloading(false)
        }
    }, [allFavorites.length, hasMore, loading, loadMore, isPreloading])

    return (
        <div className="favorites-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                virtuosoRef={virtuosoRef}
                items={allFavorites}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(allFavorites, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={allFavorites}
            />
        </div>
    )
}

export default Favorites
