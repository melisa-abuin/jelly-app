import { useEffect, useRef, useState } from 'react'
import { VirtuosoHandle } from 'react-virtuoso'
import MediaList from '../components/MediaList'
import { usePlaybackContext } from '../context/PlaybackContext'
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData'

const Tracks = () => {
    const playback = usePlaybackContext()

    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinTracksData()
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        playback.setLoadMoreCallback(() => loadMore)
        playback.setHasMoreState(hasMore)
    }, [loadMore, hasMore, playback])

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = parseInt(savedIndex, 10)
            if (index >= 0 && allTracks.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (allTracks.length > index || !hasMore) {
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
    }, [allTracks.length, hasMore, loading, loadMore, isPreloading])

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList
                virtuosoRef={virtuosoRef}
                items={allTracks}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    playback.setCurrentPlaylist(allTracks)
                    playback.playTrack(track, index)
                }}
                playlist={allTracks}
            />
        </div>
    )
}

export default Tracks
