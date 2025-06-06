import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HeartFillIcon } from '@primer/octicons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { IMenuItems } from '../context/DropdownContext/DropdownContextProvider'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { formatDateYear } from '../utils/formatDate'
import { JellyImg } from './JellyImg'
import { Loader } from './Loader'
import { IReviver } from './PlaybackManager'
import { Skeleton } from './Skeleton'
import { DeletingIcon, DownloadedIcon, DownloadingIcon, PlaystateAnimationMedalist } from './SvgIcons'

export const MediaList = ({
    items = [],
    playlistItems,
    indexOffset = 0,
    isLoading,
    type,
    title,
    reviver,
    loadMore,
    hidden: _hidden = {},
    disableActions = false,
    albumDisplayMode = 'artist',
    isDraggable,
}: {
    items: MediaItem[] | undefined
    playlistItems?: MediaItem[]
    indexOffset?: number
    isLoading: boolean
    type: 'song' | 'album' | 'artist' | 'playlist'
    title: string
    reviver?: IReviver | 'persistAll'
    loadMore?: () => void
    hidden?: IMenuItems
    disableActions?: boolean
    albumDisplayMode?: 'artist' | 'year' | 'both'
    isDraggable?: boolean
}) => {
    const playback = usePlaybackContext()
    const navigate = useNavigate()
    const { displayItems, setRowRefs } = useDisplayItems(items, isLoading)

    const hidden: IMenuItems = disableActions
        ? {
              ..._hidden,
              add_to_favorite: true,
              remove_from_favorite: true,
              add_to_playlist: true,
              remove_from_playlist: true,
          }
        : _hidden

    const dropdown = useDropdownContext()

    const [activeId, setActiveId] = useState<string | null>(null)

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.Id === active.id)
            const newIndex = items.findIndex(i => i.Id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const globalOldIndex = indexOffset + oldIndex
                const globalNewIndex = indexOffset + newIndex
                playback.moveItemInPlaylist(globalOldIndex, globalNewIndex)

                // Force update the display items
                const updated = Array.from(items)
                const [moved] = updated.splice(oldIndex, 1)
                updated.splice(newIndex, 0, moved)
                displayItems.length = 0
                displayItems.push(...updated)
            }
        }

        setActiveId(null)
    }

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveId(active.id as string)
    }

    const handleSongClick = (item: MediaItem, index: number) => {
        if (type === 'song') {
            if (playback.currentTrack?.Id === item.Id) {
                playback.togglePlayPause()
            } else {
                playback.setCurrentPlaylist({ playlist: playlistItems || items, title, reviver })
                playback.playTrack(indexOffset + index)
            }
        }
    }

    const renderItem = (index: number, item: MediaItem | { isPlaceholder: true }) => {
        if ('isPlaceholder' in item) {
            if (type === 'album') {
                return (
                    <div className="media-item album-item" ref={el => setRowRefs(index, el)}>
                        <Skeleton type="album" />
                    </div>
                )
            } else if (type === 'artist') {
                return (
                    <div className="media-item artist-item" ref={el => setRowRefs(index, el)}>
                        <Skeleton type="artist" />
                    </div>
                )
            } else if (type === 'playlist') {
                return (
                    <div className="media-item album-item" ref={el => setRowRefs(index, el)}>
                        <Skeleton type="album" />
                    </div>
                )
            } else {
                return (
                    <li className="media-item song-item" ref={el => setRowRefs(index, el)}>
                        <Skeleton type="song" />
                    </li>
                )
            }
        }

        const isActive = dropdown.selectedItem?.Id === item.Id && dropdown.isOpen

        const itemClass = [
            type === 'song' && playback.currentTrack?.Id === item.Id ? (playback.isPlaying ? 'playing' : 'paused') : '',
            isActive ? 'active' : '',
        ]
            .filter(Boolean)
            .join(' ')

        if (type === 'album') {
            return (
                <div
                    className={`media-item album-item ${itemClass}`}
                    key={item.Id}
                    onClick={() => navigate(`/album/${item.Id}`)}
                    ref={el => setRowRefs(index, el)}
                    onContextMenu={e => dropdown.onContextMenu(e, { item }, false, hidden)}
                    onTouchStart={e => dropdown.onTouchStart(e, { item }, false, hidden)}
                    onTouchMove={dropdown.onTouchClear}
                    onTouchEnd={dropdown.onTouchClear}
                >
                    <div className="media-state">
                        <JellyImg item={item} type={'Primary'} width={46} height={46} />
                    </div>
                    <div className="media-details">
                        <span className="song-name">{item.Name}</span>
                        <div className="container">
                            {albumDisplayMode === 'year' && (
                                <div className="year">{formatDateYear(item.PremiereDate)}</div>
                            )}
                            {albumDisplayMode === 'artist' && (
                                <div className="artist">{item.AlbumArtist || 'Unknown Artist'}</div>
                            )}
                            {albumDisplayMode === 'both' && (
                                <>
                                    <div className="year">{formatDateYear(item.PremiereDate)}</div>
                                    <div className="divider"></div>
                                    <div className="artist">{item.AlbumArtist || 'Unknown Artist'}</div>
                                </>
                            )}
                        </div>
                    </div>

                    <MediaIndicators item={item} disableActions={disableActions} />
                </div>
            )
        } else if (type === 'artist') {
            return (
                <div
                    className={`media-item artist-item ${itemClass}`}
                    key={item.Id}
                    onClick={() => navigate(`/artist/${item.Id}`)}
                    ref={el => setRowRefs(index, el)}
                    onContextMenu={e => dropdown.onContextMenu(e, { item }, false, hidden)}
                    onTouchStart={e => dropdown.onTouchStart(e, { item }, false, hidden)}
                    onTouchMove={dropdown.onTouchClear}
                    onTouchEnd={dropdown.onTouchClear}
                >
                    <div className="media-state">
                        <JellyImg item={item} type={'Primary'} width={36} height={36} />
                    </div>
                    <div className="media-details">
                        <div className="song-name">{item.Name || 'Unknown Artist'}</div>
                    </div>

                    <MediaIndicators item={item} disableActions={disableActions} />
                </div>
            )
        } else if (type === 'playlist') {
            return (
                <div
                    className={`media-item playlist-item ${itemClass}`}
                    key={item.Id}
                    onClick={() => navigate(`/playlist/${item.Id}`)}
                    ref={el => setRowRefs(index, el)}
                    onContextMenu={e => dropdown.onContextMenu(e, { item }, false, hidden)}
                    onTouchStart={e => dropdown.onTouchStart(e, { item }, false, hidden)}
                    onTouchMove={dropdown.onTouchClear}
                    onTouchEnd={dropdown.onTouchClear}
                >
                    <div className="media-state">
                        <JellyImg item={item} type={'Primary'} width={46} height={46} />
                    </div>
                    <div className="media-details">
                        <span className="song-name">{item.Name}</span>
                        <div className="container">
                            <div className="track-amount">
                                <span className="number">{item.ChildCount || 0}</span>{' '}
                                <span>{(item.ChildCount || 0) === 1 ? 'Track' : 'Tracks'}</span>
                            </div>
                        </div>
                    </div>

                    <MediaIndicators item={item} disableActions={disableActions} />
                </div>
            )
        } else {
            return (
                <div
                    className={`media-item song-item ${itemClass}`}
                    onClick={() => handleSongClick(item, index)}
                    key={item.Id}
                    ref={el => setRowRefs(index, el)}
                    onContextMenu={e => dropdown.onContextMenu(e, { item }, false, hidden)}
                    onTouchStart={e => dropdown.onTouchStart(e, { item }, false, hidden)}
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
                            <div className="divider"></div>
                            <div className="album">{item.Album || 'Unknown Album'}</div>
                        </div>
                    </div>

                    <MediaIndicators item={item} disableActions={disableActions} />
                </div>
            )
        }
    }

    if (isLoading && items.length === 0) {
        return <Loader />
    }

    if (items.length === 0 && !isLoading) {
        return (
            <div className="empty">
                {type === 'song'
                    ? 'No tracks were found'
                    : type === 'album'
                    ? 'No albums were found'
                    : type === 'artist'
                    ? 'No artists were found'
                    : 'No playlists were found'}
            </div>
        )
    }

    return (
        <ul className="media-list noSelect">
            {isDraggable && (
                <DraggableVirtuoso
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    items={items}
                    renderItem={renderItem}
                    activeId={activeId}
                >
                    <Virtuoso
                        data={displayItems}
                        useWindowScroll
                        itemContent={(index, item) => {
                            if ('isPlaceholder' in item) {
                                return renderItem(index, item)
                            }

                            return (
                                <SortableItem key={item.Id} id={item.Id}>
                                    {renderItem(index, item)}
                                </SortableItem>
                            )
                        }}
                        endReached={loadMore}
                        overscan={800}
                    />
                </DraggableVirtuoso>
            )}

            {!isDraggable && (
                <Virtuoso
                    data={displayItems}
                    useWindowScroll
                    itemContent={renderItem}
                    endReached={loadMore}
                    overscan={800}
                />
            )}
        </ul>
    )
}

const DraggableVirtuoso = ({
    handleDragStart,
    handleDragEnd,
    items,
    renderItem,
    activeId,
    children,
}: {
    handleDragStart: (event: DragStartEvent) => void
    handleDragEnd: (event: DragEndEvent) => void
    items: MediaItem[]
    renderItem: (index: number, item: MediaItem | { isPlaceholder: true }) => React.ReactNode
    activeId: string | null
    children: React.ReactNode
}) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext items={items.map(i => i.Id)} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
            <DragOverlay>
                {activeId
                    ? renderItem(
                          items.findIndex(i => i.Id === activeId),
                          items.find(i => i.Id === activeId)!
                      )
                    : null}
            </DragOverlay>
        </DndContext>
    )
}

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 999 : undefined,
        opacity: isDragging ? 0 : 1,
    }

    return (
        <li ref={setNodeRef} className={isDragging ? 'active' : ''} style={style} {...attributes} {...listeners}>
            {children}
        </li>
    )
}

const MediaIndicators = ({ item, disableActions }: { item: MediaItem; disableActions: boolean }) => {
    return (
        <div className="media-indicators">
            {item.offlineState && (
                <div className="download-state">
                    {item.offlineState === 'downloading' && (
                        <div className="icon downloading" title="Syncing...">
                            <DownloadingIcon width={16} height={16} />
                        </div>
                    )}

                    {item.offlineState === 'downloaded' && (
                        <div className="icon downloaded" title="Synced">
                            <DownloadedIcon width={16} height={16} />
                        </div>
                    )}

                    {item.offlineState === 'deleting' && (
                        <div className="icon deleting" title="Unsyncing...">
                            <DeletingIcon width={16} height={16} />
                        </div>
                    )}
                </div>
            )}

            {!disableActions && item.UserData?.IsFavorite && location.pathname !== '/favorites' && (
                <div className="favorited" title="Favorited">
                    <HeartFillIcon size={16} />
                </div>
            )}
        </div>
    )
}
