import { HeartFillIcon } from '@primer/octicons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { JellyImg } from './JellyImg'
import Loader from './Loader'
import './QueueTrackList.css'
import Skeleton from './Skeleton'

interface QueueTrackListProps {
    tracks: MediaItem[]
    loading: boolean
    loadMore?: () => Promise<MediaItem[] | undefined>
    hasMore?: boolean
    playTrack: (index: number) => void
    playlist: MediaItem[]
    playlistId?: string
    showType?: 'artist' | 'album'
    showTrackNumber?: boolean
    disablePagination?: boolean
}

const QueueTrackList = ({
    tracks,
    loading,
    loadMore,
    hasMore,
    playTrack,
    playlistId,
    showType,
    showTrackNumber = false,
    disablePagination = false,
}: QueueTrackListProps) => {
    const playback = usePlaybackContext()
    const rowRefs = useRef<(HTMLLIElement | null)[]>([])
    const resizeObservers = useRef<ResizeObserver[]>([])
    const location = useLocation()
    const sizeMap = useRef<{ [index: number]: number }>({})
    const [displayItems, setDisplayItems] = useState<(MediaItem | { isPlaceholder: true })[]>(tracks)

    useEffect(() => {
        if ((loading || (hasMore && loadMore)) && !disablePagination) {
            setDisplayItems([...tracks, ...Array(4).fill({ isPlaceholder: true })])
        } else {
            setDisplayItems(tracks)
        }
    }, [tracks, loading, hasMore, loadMore, disablePagination])

    useEffect(() => {
        const handleResize = () => {
            measureInitialHeights()
        }

        const setupResizeObservers = () => {
            resizeObservers.current = rowRefs.current.map((ref, index) => {
                const observer = new ResizeObserver(() => {
                    if (ref) {
                        const originalHeight = ref.style.height
                        ref.style.height = 'auto'
                        const height = ref.getBoundingClientRect().height
                        ref.style.height = originalHeight || `${height}px`
                        if (height !== sizeMap.current[index]) {
                            setSize(index, height)
                        }
                    }
                })
                if (ref) observer.observe(ref)
                return observer
            })
        }

        const cleanupResizeObservers = () => {
            resizeObservers.current.forEach(observer => observer.disconnect())
            resizeObservers.current = []
        }

        const measureInitialHeights = () => {
            rowRefs.current.forEach((ref, index) => {
                if (ref) {
                    const originalHeight = ref.style.height
                    ref.style.height = 'auto'
                    const height = ref.getBoundingClientRect().height
                    ref.style.height = originalHeight || `${height}px`
                    if (height !== sizeMap.current[index]) {
                        setSize(index, height)
                    }
                }
            })
        }

        rowRefs.current = displayItems.map(() => null)
        cleanupResizeObservers()
        measureInitialHeights()
        setupResizeObservers()
        document.body.style.overflowY = 'auto'
        window.addEventListener('resize', handleResize)

        return () => {
            cleanupResizeObservers()
            window.removeEventListener('resize', handleResize)
        }
    }, [displayItems])

    const setSize = (index: number, height: number) => {
        sizeMap.current = { ...sizeMap.current, [index]: height }
    }

    const handleTrackClick = useCallback(
        (track: MediaItem, index: number, event: React.MouseEvent) => {
            if (event.type !== 'click') return
            if (playback.currentTrack?.Id === track.Id) {
                playback.togglePlayPause()
            } else {
                playTrack(index)
            }
        },
        [playTrack, playback]
    )

    const handleEndReached = useCallback(() => {
        console.log('endReached:', { hasMore, loadMore: !!loadMore, disablePagination })
        if (hasMore && loadMore && !disablePagination) {
            loadMore()
        }
    }, [hasMore, loadMore, disablePagination])

    const renderTrack = (index: number, item: MediaItem | { isPlaceholder: true }) => {
        if ('isPlaceholder' in item) {
            return (
                <li
                    className="track-item"
                    ref={el => {
                        rowRefs.current[index] = el
                    }}
                >
                    <Skeleton type="playlist" />
                </li>
            )
        }

        const track = item
        const trackClass = playback.currentTrack?.Id === track.Id ? (playback.isPlaying ? 'playing' : 'paused') : ''
        const isFavorite = track.UserData?.IsFavorite && location.pathname !== '/favorites'

        return (
            <li
                className={`track-item ${trackClass}`}
                onClick={event => handleTrackClick(track, index, event)}
                key={track.Id}
                ref={el => {
                    rowRefs.current[index] = el
                }}
            >
                <div className="track-state">
                    <JellyImg item={track} type={'Primary'} width={40} height={40} />
                    <div className="overlay">
                        <div className="container">
                            <div className="play">
                                <div className="play-icon"></div>
                            </div>
                            <div className="pause">
                                <div className="pause-icon"></div>
                            </div>
                        </div>
                        <div className="play-state-animation">
                            <svg width="18" height="18" viewBox="0 0 18 18" className="sound-bars">
                                <rect x="1" y="10" width="3" height="8" rx="1.5" className="bar bar1"></rect>
                                <rect x="5" y="9" width="3" height="9" rx="1.5" className="bar bar2"></rect>
                                <rect x="9" y="11" width="3" height="7" rx="1.5" className="bar bar3"></rect>
                                <rect x="13" y="10" width="3" height="8" rx="1.5" className="bar bar4"></rect>
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="track-details">
                    <span className="track-name">
                        {showTrackNumber && <span className="track-number">{index + 1}.</span>}
                        {track.Name}
                    </span>
                    <div className="container">
                        {showType === 'artist' ? (
                            <div className="artist">
                                {track.Artists && track.Artists.length > 0
                                    ? track.Artists.join(', ')
                                    : 'Unknown Artist'}
                            </div>
                        ) : showType === 'album' ? (
                            <div className="album">{track.Album || 'Unknown Album'}</div>
                        ) : (
                            <>
                                <div className="artist">
                                    {track.Artists && track.Artists.length > 0
                                        ? track.Artists.join(', ')
                                        : 'Unknown Artist'}
                                </div>
                                <div className="divider"></div>
                                <div className="album">{track.Album || 'Unknown Album'}</div>
                            </>
                        )}
                    </div>
                </div>
                <div className="track-indicators">
                    {isFavorite && (
                        <div className="favorited" title="Favorited">
                            <HeartFillIcon size={14} />
                        </div>
                    )}
                    <div className="actions"></div>
                </div>
            </li>
        )
    }

    if (loading && tracks.length === 0 && !disablePagination) {
        return <Loader />
    }

    if (!loading && tracks.length === 0 && !disablePagination) {
        return <div className="empty">No tracks were found</div>
    }

    return (
        <ul className="queue-tracklist noSelect">
            <Virtuoso
                key={playlistId}
                data={displayItems}
                useWindowScroll
                itemContent={renderTrack}
                endReached={disablePagination ? undefined : handleEndReached}
                overscan={800}
            />
        </ul>
    )
}

export default QueueTrackList
