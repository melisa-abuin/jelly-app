import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import MediaList from '../components/MediaList'
import { usePageTitle } from '../context/PageTitleContext'
import { useJellyfinGenreTracks } from '../hooks/useJellyfinGenreTracks'

interface GenreProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    currentTrackIndex: number
    isPlaying: boolean
    togglePlayPause: () => void
    setCurrentPlaylist: (playlist: MediaItem[]) => void
    setLoadMoreCallback?: (callback: () => void) => void
    setHasMoreState?: (hasMore: boolean) => void
}

const Genre = ({
    user,
    serverUrl,
    token,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    setCurrentPlaylist,
}: GenreProps) => {
    const { genre } = useParams<{ genre: string }>()
    const { tracks, loading, error, loadMore, hasMore } = useJellyfinGenreTracks(serverUrl, user.userId, token, genre!)
    const { setPageTitle } = usePageTitle()
    const virtuosoRef = useRef<any>(null)
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
    }, [tracks.length, hasMore, loading, loadMore])

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
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(track, index) => {
                    setCurrentPlaylist(tracks)
                    playTrack(track, index)
                }}
                currentTrack={currentTrack}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                togglePlayPause={togglePlayPause}
                playlist={tracks}
            />
        </div>
    )
}

export default Genre
