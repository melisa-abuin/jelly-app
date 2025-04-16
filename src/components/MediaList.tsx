import { HeartFillIcon } from '@primer/octicons-react'
import { Ref, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import Loader from './Loader'
import Skeleton from './Skeleton'

interface MediaListProps {
    virtuosoRef?: Ref<VirtuosoHandle>
    items: MediaItem[] | undefined
    type: 'song' | 'album'
    loading: boolean
    loadMore?: () => void
    hasMore?: boolean
    playTrack: (index: number) => void
    playlist?: MediaItem[]
    setCurrentPlaylist?: (playlist: MediaItem[]) => void
}

const MediaList = ({
    virtuosoRef,
    items = [],
    type,
    loading,
    loadMore,
    hasMore,
    playTrack,
    playlist = [],
    setCurrentPlaylist,
}: MediaListProps) => {
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const rowRefs = useRef<(HTMLLIElement | HTMLDivElement | null)[]>([])
    const resizeObservers = useRef<ResizeObserver[]>([])
    const navigate = useNavigate()
    const location = useLocation()
    const sizeMap = useRef<{ [index: number]: number }>({})
    const [displayItems, setDisplayItems] = useState<(MediaItem | { isPlaceholder: true })[]>(items)

    useEffect(() => {
        if (loading && hasMore && loadMore) {
            setDisplayItems([...items, ...Array(4).fill({ isPlaceholder: true })])
        } else {
            setDisplayItems(items)
        }
    }, [items, loading, hasMore, loadMore])

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

        const setSize = (index: number, height: number) => {
            sizeMap.current = { ...sizeMap.current, [index]: height }
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

    const handleSongClick = (item: MediaItem, index: number) => {
        if (type === 'song') {
            if (playback.currentTrack?.Id === item.Id) {
                playback.togglePlayPause()
            } else {
                const playlistIndex = playlist.findIndex(track => track.Id === item.Id)
                if (setCurrentPlaylist) {
                    setCurrentPlaylist(items)
                }
                const effectiveIndex = playlistIndex !== -1 && playback.currentTrackIndex !== -1 ? playlistIndex : index
                playTrack(effectiveIndex)
            }
        }
    }

    const handleEndReached = () => {
        if (hasMore && loadMore && !loading) {
            loadMore()
        }
    }

    const renderItem = (index: number, item: MediaItem | { isPlaceholder: true }) => {
        if ('isPlaceholder' in item) {
            return type === 'album' ? (
                <div
                    className="media-item album-item"
                    ref={(el: HTMLDivElement | null) => {
                        rowRefs.current[index] = el
                    }}
                >
                    <Skeleton type="album" />
                </div>
            ) : (
                <li
                    className="media-item song-item"
                    ref={(el: HTMLLIElement | null) => {
                        rowRefs.current[index] = el
                    }}
                >
                    <Skeleton type="song" />
                </li>
            )
        }

        const imageUrl = api.getImageUrl(item, 'Primary', { width: 46, height: 46 })

        const itemClass =
            type === 'song' && playback.currentTrack?.Id === item.Id ? (playback.isPlaying ? 'playing' : 'paused') : ''

        return type === 'album' ? (
            <div
                className={`media-item album-item`}
                key={item.Id}
                onClick={() => navigate(`/album/${item.Id}`)}
                ref={(el: HTMLDivElement | null) => {
                    rowRefs.current[index] = el
                }}
            >
                <div className="media-state">
                    <img
                        src={imageUrl}
                        alt={item.Name}
                        className="thumbnail"
                        loading="lazy"
                        onError={e => {
                            ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                        }}
                    />
                </div>
                <div className="media-details">
                    <span className="song-name">{item.Name}</span>
                    <div className="container">
                        <div className="artist">{item.AlbumArtist || 'Unknown Artist'}</div>
                    </div>
                </div>
                {item.UserData?.IsFavorite && location.pathname !== '/favorites' && (
                    <div className="favorited" title="Favorited">
                        <HeartFillIcon size={16} />
                    </div>
                )}
            </div>
        ) : (
            <li
                className={`media-item song-item ${itemClass}`}
                onClick={() => handleSongClick(item, index)}
                key={item.Id}
                ref={(el: HTMLLIElement | null) => {
                    rowRefs.current[index] = el
                }}
            >
                <div className="media-state">
                    <img
                        src={imageUrl}
                        alt={item.Name}
                        className="thumbnail"
                        loading="lazy"
                        onError={e => {
                            ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                        }}
                    />
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
                            <svg width="28" height="20" viewBox="0 0 28 20" className="sound-bars">
                                <rect x="2" y="12" width="2" height="8" rx="1" className="bar bar1"></rect>
                                <rect x="6" y="10" width="2" height="10" rx="1" className="bar bar2"></rect>
                                <rect x="10" y="14" width="2" height="6" rx="1" className="bar bar3"></rect>
                                <rect x="14" y="11" width="2" height="9" rx="1" className="bar bar4"></rect>
                                <rect x="18" y="13" width="2" height="7" rx="1" className="bar bar5"></rect>
                                <rect x="22" y="12" width="2" height="8" rx="1" className="bar bar6"></rect>
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="media-details">
                    <span className="song-name">{item.Name}</span>
                    <div className="container">
                        <div className="artist">
                            {item.Artists && item.Artists.length > 0 ? item.Artists.join(', ') : 'Unknown Artist'}
                        </div>
                        <>
                            <div className="divider"></div>
                            <div className="album">{item.Album || 'Unknown Album'}</div>
                        </>
                    </div>
                </div>
                {item.UserData?.IsFavorite && location.pathname !== '/favorites' && (
                    <div className="favorited" title="Favorited">
                        <HeartFillIcon size={16} />
                    </div>
                )}
            </li>
        )
    }

    if (loading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !loading) {
        return <div className="empty">{type === 'song' ? 'No tracks were found' : 'No albums were found'}</div>
    }

    return (
        <ul className="media-list noSelect">
            <Virtuoso
                ref={virtuosoRef}
                data={displayItems}
                useWindowScroll
                itemContent={renderItem}
                endReached={handleEndReached}
                overscan={800}
            />
        </ul>
    )
}

export default MediaList
