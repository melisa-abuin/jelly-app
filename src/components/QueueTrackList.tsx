import { useCallback, useEffect, useRef, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { JellyImg } from './JellyImg'
import './QueueTrackList.css'
import Skeleton from './Skeleton'

interface QueueTrackListProps {
    tracks: MediaItem[]
    singleTrack?: boolean
}

const QueueTrackList = ({ tracks, singleTrack = false }: QueueTrackListProps) => {
    const playback = usePlaybackContext()
    const rowRefs = useRef<(HTMLLIElement | null)[]>([])
    const resizeObservers = useRef<ResizeObserver[]>([])
    const sizeMap = useRef<{ [index: number]: number }>({})
    const [displayItems, setDisplayItems] = useState<(MediaItem | { isPlaceholder: true })[]>(tracks)

    useEffect(() => {
        if (playback.loading && playback.hasMore && playback.loadMore && !singleTrack) {
            setDisplayItems([...tracks, ...Array(4).fill({ isPlaceholder: true })])
        } else {
            setDisplayItems(tracks)
        }
    }, [tracks, singleTrack, playback.loading, playback.hasMore, playback.loadMore])

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
        if (!singleTrack) {
            document.body.style.overflowY = 'auto'
            window.addEventListener('resize', handleResize)
        }

        return () => {
            cleanupResizeObservers()
            if (!singleTrack) {
                window.removeEventListener('resize', handleResize)
            }
        }
    }, [displayItems, singleTrack])

    const setSize = (index: number, height: number) => {
        sizeMap.current = { ...sizeMap.current, [index]: height }
    }

    const handleTrackClick = useCallback(
        (track: MediaItem, index: number) => {
            if (playback.currentTrack?.Id === track.Id) {
                playback.togglePlayPause()
            } else {
                playback.playTrack(index)
            }
        },
        [playback]
    )

    const handleEndReached = async () => {
        if (playback.hasMore && playback.loadMore && !playback.loading) {
            playback.loadMore()
        }
    }

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

        return (
            <li
                className={`track-item ${trackClass}`}
                onClick={() => handleTrackClick(track, index)}
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
                    <span className="track-name">{track.Name}</span>
                    <div className="container">
                        <div className="artist">
                            {track.Artists && track.Artists.length > 0 ? track.Artists.join(', ') : 'Unknown Artist'}
                        </div>
                        {track.Album && (
                            <>
                                <div className="divider"></div>
                                <div className="album">{track.Album}</div>
                            </>
                        )}
                    </div>
                </div>
            </li>
        )
    }

    if (singleTrack) {
        return <ul className="queue-tracklist noSelect">{renderTrack(0, displayItems[0])}</ul>
    }

    return (
        <ul className="queue-tracklist noSelect">
            <Virtuoso
                data={displayItems}
                useWindowScroll
                itemContent={renderTrack}
                endReached={handleEndReached}
                overscan={800}
            />
        </ul>
    )
}

export default QueueTrackList
