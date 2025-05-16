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
import { PlaystateAnimationMedalist } from './SvgIcons'

interface MediaListProps {
    items: MediaItem[] | undefined
    isLoading: boolean
    type: 'song' | 'album'
}

const MediaList = ({ items = [], isLoading, type }: MediaListProps) => {
    const playback = usePlaybackContext()
    const navigate = useNavigate()
    const location = useLocation()
    const { displayItems, setRowRefs } = useDisplayItems(items, isLoading)

    const dropdown = useDropdownContext()

    const handleSongClick = (item: MediaItem, index: number) => {
        if (type === 'song') {
            if (playback.currentTrack?.Id === item.Id) {
                playback.togglePlayPause()
            } else {
                playback.setCurrentPlaylist({ playlist: items })
                playback.playTrack(index)
            }
        }
    }

    const handleEndReached = () => {
        if (playback.hasMore && playback.loadMore && !isLoading) {
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

        const isActive = dropdown.selectedItem?.Id === item.Id && dropdown.isOpen

        const itemClass = [
            type === 'song' && playback.currentTrack?.Id === item.Id ? (playback.isPlaying ? 'playing' : 'paused') : '',
            isActive ? 'active' : '',
        ]
            .filter(Boolean)
            .join(' ')

        return type === 'album' ? (
            <div
                className={`media-item album-item ${itemClass}`}
                key={item.Id}
                onClick={() => navigate(`/album/${item.Id}`)}
                ref={el => setRowRefs(index, el)}
                onContextMenu={e => dropdown.onContextMenu(e, { item })}
                onTouchStart={e => dropdown.onTouchStart(e, { item })}
                onTouchMove={dropdown.onTouchClear}
                onTouchEnd={dropdown.onTouchClear}
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
                onContextMenu={e => dropdown.onContextMenu(e, { item })}
                onTouchStart={e => dropdown.onTouchStart(e, { item })}
                onTouchMove={dropdown.onTouchClear}
                onTouchEnd={dropdown.onTouchClear}
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
                            <PlaystateAnimationMedalist width={28} height={20} className="sound-bars" />
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

    if (isLoading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !isLoading) {
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
