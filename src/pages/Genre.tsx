import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { VirtuosoHandle } from 'react-virtuoso'
import MediaList from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext'
import { useJellyfinGenreTracks } from '../hooks/useJellyfinGenreTracks'

const Genre = () => {
    const playback = usePlaybackContext()

    const { genre } = useParams<{ genre: string }>()
    const { tracks, loading, error, loadMore, hasMore } = useJellyfinGenreTracks(genre!)
    const { setPageTitle } = usePageTitle()
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        if (genre) {
            setPageTitle(decodeURIComponent(genre))
        }
        return () => {
            setPageTitle('')
        }
    }, [genre, setPageTitle])

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = parseInt(savedIndex, 10)
            if (index >= 0 && tracks.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (tracks.length > index || !hasMore) {
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
    }, [tracks.length, hasMore, loading, loadMore, isPreloading])

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="genre-page">
            <MediaList
                virtuosoRef={virtuosoRef}
                items={tracks}
                type="song"
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    playback.setCurrentPlaylist(tracks)
                    playback.playTrack(track, index)
                }}
                playlist={tracks}
            />
        </div>
    )
}

export default Genre
