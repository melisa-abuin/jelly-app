import { HeartFillIcon } from '@primer/octicons-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { JellyImg } from './JellyImg'
import Loader from './Loader'
import Skeleton from './Skeleton'

interface MediaListProps {
    items: MediaItem[] | undefined
    type: 'song' | 'album'
    queryKey?: string
}

const MediaList = ({ items = [], type, queryKey }: MediaListProps) => {
    const playback = usePlaybackContext()
    const navigate = useNavigate()
    const location = useLocation()
    const { displayItems, setRowRefs } = useDisplayItems(items)

    const dropdown = useDropdownContext()

    const handleSongClick = (item: MediaItem, index: number) => {
        if (type === 'song') {
            if (playback.currentTrack?.Id === item.Id) {
                playback.togglePlayPause()
            } else {
                const playlistIndex = items.findIndex(track => track.Id === item.Id)
                const effectiveIndex = playlistIndex !== -1 && playback.currentTrackIndex !== -1 ? playlistIndex : index

                playback.setCurrentPlaylist({ playlist: items, type: queryKey })
                playback.playTrack(effectiveIndex)
            }
        }
    }

    const handleEndReached = () => {
        if (playback.hasMore && playback.loadMore && !playback.loading) {
            playback.loadMore()
        }
    }

    const renderItem = (index: number, item: MediaItem | { isPlaceholder: true }) => {
        if ('isPlaceholder' in item) {
            return type === 'album' ? (
                <div className="media-item album-item" ref={el => setRowRefs(index, el)}>
                    <Skeleton type="album" />
                </div>
            ) : (
                <li className="media-item song-item" ref={el => setRowRefs(index, el)}>
                    <Skeleton type="song" />
                </li>
            )
        }

        const isActive = dropdown.selectedItem?.Id === item.Id

        const itemClass = [
            type === 'song' && playback.currentTrack?.Id === item.Id ? (playback.isPlaying ? 'playing' : 'paused') : '',
            isActive ? 'active' : '',
        ]
            .filter(Boolean)
            .join(' ')

        return type === 'album' ? (
            <div
                className={`media-item album-item`}
                key={item.Id}
                onClick={() => navigate(`/album/${item.Id}`)}
                ref={el => setRowRefs(index, el)}
            >
                <div className="media-state">
                    <JellyImg item={item} type={'Primary'} width={46} height={46} />
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
                ref={el => setRowRefs(index, el)}
                onContextMenu={e => dropdown.onContextMenu(e, item)}
                onTouchStart={e => dropdown.onTouchStart(e, item)}
                onTouchEnd={dropdown.onTouchEnd}
            >
                <div className="media-state">
                    <JellyImg item={item} type={'Primary'} width={46} height={46} />

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

    if (playback.loading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !playback.loading) {
        return <div className="empty">{type === 'song' ? 'No tracks were found' : 'No albums were found'}</div>
    }

    return (
        <ul className="media-list noSelect">
            <Virtuoso
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
