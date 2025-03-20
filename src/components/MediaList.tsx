import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import Loader from './Loader'

interface ExtendedMediaItem extends MediaItem {
    AlbumId?: string
    AlbumPrimaryImageTag?: string
}

interface MediaListProps {
    items: MediaItem[]
    type: 'song' | 'album'
    loading: boolean
    serverUrl: string
    loadMore?: () => void
    hasMore?: boolean
    playTrack: (track: MediaItem, index: number) => void
    currentTrack: MediaItem | null
    currentTrackIndex: number
    isPlaying: boolean
    togglePlayPause: () => void
    playlist?: MediaItem[]
}

const MediaList = ({
    items,
    type,
    loading,
    serverUrl,
    loadMore,
    hasMore,
    playTrack,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    togglePlayPause,
    playlist = [],
}: MediaListProps) => {
    const rowRefs = useRef<(HTMLLIElement | HTMLDivElement | null)[]>([])
    const resizeObservers = useRef<ResizeObserver[]>([])
    const navigate = useNavigate()
    const sizeMap = useRef<{ [index: number]: number }>({})

    useEffect(() => {
        rowRefs.current = items.map(() => null)
        measureInitialHeights()
        setupResizeObservers()
        document.body.style.overflowY = 'auto'
        window.addEventListener('resize', handleResize)

        return () => {
            cleanupResizeObservers()
            window.removeEventListener('resize', handleResize)
        }
    }, [items])

    useEffect(() => {
        if (items.length !== rowRefs.current.length) {
            cleanupResizeObservers()
            rowRefs.current = items.map(() => null)
            measureInitialHeights()
            setupResizeObservers()
        }
    }, [items])

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

    const handleSongClick = (item: MediaItem, index: number) => {
        if (type === 'song') {
            if (currentTrack?.Id === item.Id) {
                togglePlayPause()
            } else {
                // Find the index of the item in the playlist
                const playlistIndex = playlist.findIndex(track => track.Id === item.Id)
                if (playlistIndex !== -1) {
                    playTrack(item, playlistIndex)
                } else {
                    console.warn('Track not found in playlist:', item)
                    playTrack(item, index)
                }
            }
        }
    }

    const handleSongThumbnailClick = (item: MediaItem, index: number, e: React.MouseEvent) => {
        e.stopPropagation()
        if (type === 'song') {
            if (currentTrack?.Id === item.Id && isPlaying) {
                togglePlayPause()
            } else {
                // Find the index of the item in the playlist
                const playlistIndex = playlist.findIndex(track => track.Id === item.Id)
                if (playlistIndex !== -1) {
                    playTrack(item, playlistIndex)
                } else {
                    console.warn('Track not found in playlist:', item)
                    playTrack(item, index)
                }
            }
        }
    }

    const handleEndReached = () => {
        if (hasMore && loadMore) {
            loadMore()
        }
    }

    const renderItem = (index: number) => {
        const item = items[index] as ExtendedMediaItem
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).token : ''
        const imageUrl = item.ImageTags?.Primary
            ? `${serverUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&fillWidth=192&fillHeight=192&format=webp&api_key=${token}`
            : item.AlbumPrimaryImageTag && item.AlbumId
            ? `${serverUrl}/Items/${item.AlbumId}/Images/Primary?tag=${item.AlbumPrimaryImageTag}&quality=90&fillWidth=192&fillHeight=192&format=webp&api_key=${token}`
            : '/default-thumbnail.png'

        const itemClass = type === 'song' && currentTrack?.Id === item.Id ? (isPlaying ? 'playing' : 'paused') : ''

        return type === 'album' ? (
            <div
                className={`media-item album-item`}
                key={item.Id}
                onClick={() => navigate(`/albums/${item.Id}`)}
                ref={el => {
                    rowRefs.current[index] = el
                }}
            >
                <div className="media-state">
                    <img
                        src={imageUrl}
                        alt={item.Name}
                        className="thumbnail"
                        onError={e => {
                            console.error(`Image load failed for ${item.Name}:`, e, 'URL:', imageUrl)
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
            </div>
        ) : (
            <li
                className={`media-item song-item ${itemClass}`}
                onClick={() => handleSongClick(item, index)}
                key={item.Id}
                ref={el => {
                    rowRefs.current[index] = el
                }}
            >
                <div className="media-state">
                    <img
                        src={imageUrl}
                        alt={item.Name}
                        className="thumbnail"
                        onError={e => {
                            console.error(`Image load failed for ${item.Name}:`, e, 'URL:', imageUrl)
                            ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
                        }}
                        onClick={e => handleSongThumbnailClick(item, index, e)}
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
                                <rect
                                    x="2"
                                    y="12"
                                    width="2"
                                    height="8"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar1"
                                ></rect>
                                <rect
                                    x="6"
                                    y="10"
                                    width="2"
                                    height="10"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar2"
                                ></rect>
                                <rect
                                    x="10"
                                    y="14"
                                    width="2"
                                    height="6"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar3"
                                ></rect>
                                <rect
                                    x="14"
                                    y="11"
                                    width="2"
                                    height="9"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar4"
                                ></rect>
                                <rect
                                    x="18"
                                    y="13"
                                    width="2"
                                    height="7"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar5"
                                ></rect>
                                <rect
                                    x="22"
                                    y="12"
                                    width="2"
                                    height="8"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar6"
                                ></rect>
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
            </li>
        )
    }

    if (loading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0) {
        return <div className="empty">{type === 'song' ? 'No tracks' : 'No albums'}</div>
    }

    return (
        <ul className="media-list noSelect">
            <Virtuoso
                data={items}
                useWindowScroll
                totalCount={items.length}
                itemContent={(index: number) => renderItem(index)}
                endReached={handleEndReached}
                overscan={350}
            />
        </ul>
    )
}

export default MediaList
