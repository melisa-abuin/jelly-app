import { ChevronRightIcon } from '@primer/octicons-react'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinPlaylistsList } from '../../hooks/Jellyfin/useJellyfinPlaylistsList'
import { useFavorites } from '../../hooks/useFavorites'
import { useJellyfinContext } from '../JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../PlaybackContext/PlaybackContext'
import { useScrollContext } from '../ScrollContext/ScrollContext'
import { DropdownContext } from './DropdownContext'

export type IDropdownContext = ReturnType<typeof useInitialState>

type IContext = { item: MediaItem; playlistId?: string }

const useInitialState = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [context, setContext] = useState<IContext>()
    const [subDropdown, setSubDropdown] = useState<{
        isOpen: boolean
        type: 'view-artists' | 'add-playlist' | ''
        flipY: boolean
        width: number
        height: number
        top: number
    }>({
        isOpen: false,
        type: '',
        flipY: false,
        width: 0,
        height: 0,
        top: 0,
    })
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const [ignoreMargin, setIgnoreMargin] = useState(false)
    const scrollContext = useScrollContext()
    const [hidden, setHidden] = useState<{ [x in keyof typeof menuItems]?: boolean }>()
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const { playlists } = useJellyfinPlaylistsList()
    const { addToFavorites, removeFromFavorites } = useFavorites()

    const subMenuRef = useRef<HTMLDivElement>(null)

    const menuRef = useRef<HTMLDivElement>(null)

    const [playlistName, setPlaylistName] = useState<string>('')

    const closeSubDropdown = useCallback(() => {
        setSubDropdown(prev => ({ ...prev, isOpen: false, type: '' }))
    }, [])

    const closeDropdown = useCallback(() => {
        setIsOpen(false)
        setSubDropdown({
            isOpen: false,
            type: '',
            flipY: false,
            width: 0,
            height: 0,
            top: 0,
        })
        setIgnoreMargin(false)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPlaylistName(e.target.value)
    const handleInputKeyDown = useCallback(
        async (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && playlistName.trim() && context) {
                const playlist = await api.createPlaylist(playlistName.trim())
                await api.addToPlaylist(playlist.Id!, context.item.Id)
                setPlaylistName('')
                closeDropdown()
            } else if (e.key === 'Escape') {
                setPlaylistName('')
            }
        },
        [playlistName, context, api, closeDropdown]
    )

    const handleCreateClick = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            if (playlistName.trim() && context) {
                const playlist = await api.createPlaylist(playlistName.trim())
                await api.addToPlaylist(playlist.Id!, context.item.Id)
                setPlaylistName('')
                closeDropdown()
            }
        },
        [playlistName, context, api, closeDropdown]
    )

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDropdown()
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [closeDropdown])

    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            if (!isOpen) return
            const path = (e.composedPath?.() as unknown as Node[]) || []
            const clickedInside = path.some(
                node =>
                    node === menuRef.current ||
                    (node instanceof HTMLElement &&
                        (node.closest('.dropdown') !== null || node.closest('.sub-dropdown') !== null))
            )
            if (!clickedInside) {
                closeDropdown()
            }
        }

        document.addEventListener('pointerdown', handlePointerDown, true)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true)
        }
    }, [closeDropdown, isOpen])

    const openSubDropdown = useCallback(
        (type: 'view-artists' | 'add-playlist', e: React.MouseEvent<HTMLDivElement>) => {
            const el = e.currentTarget
            const rect = el.getBoundingClientRect()
            const menuHeight = (subMenuRef.current?.querySelector('.dropdown-menu') as HTMLElement)?.offsetHeight || 0
            const margin = 40
            const viewportBottom = window.innerHeight
            const flipY = rect.top + menuHeight + margin > viewportBottom
            const top = flipY ? -menuHeight + rect.height : 0
            setSubDropdown({
                isOpen: true,
                type,
                top,
                width: rect.width,
                height: rect.height,
                flipY,
            })
        },
        []
    )

    useEffect(() => {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 480
        setIsTouchDevice(isTouch)
    }, [])

    useEffect(() => {
        if (scrollContext && isTouchDevice) {
            scrollContext.setDisabled(isOpen)
        }
    }, [isOpen, isTouchDevice, scrollContext])

    const openDropdown = useCallback(
        (context: IContext, x: number, y: number, ignoreMargin = false) => {
            let adjustedX = x
            let adjustedY = y
            if (isTouchDevice) {
                adjustedX = 0
                adjustedY = window.innerHeight
            } else if (!ignoreMargin) {
                const menuWidth = 210 // Approximate dropdown width
                const menuHeight = 180 // Approximate dropdown height
                const margin = 20
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight + window.pageYOffset

                // Ensure dropdown stays within viewport
                adjustedX = x + menuWidth + margin > viewportWidth ? viewportWidth - menuWidth - margin : x
                adjustedY = y + menuHeight + margin > viewportHeight ? viewportHeight - menuHeight - margin : y
                adjustedY = y < margin ? margin : adjustedY // Prevent top overflow
                adjustedX = x < margin ? margin : adjustedX // Prevent left overflow
            }
            setIsOpen(true)
            setPosition({ x: adjustedX, y: adjustedY })
            setContext(context)
            setSubDropdown({
                isOpen: false,
                type: '',
                flipY: false,
                top: 0,
                width: 0,
                height: 0,
            })
            setIgnoreMargin(ignoreMargin)
        },
        [isTouchDevice]
    )

    const handlePlayNext = useCallback(() => {
        if (context) {
            const playlist = playback.currentPlaylist
            const currentIndex = playback.currentTrackIndex
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : playlist.length
            const newPlaylist = [...playlist]
            newPlaylist.splice(insertIndex, 0, context.item)
            playback.setCurrentPlaylist({ playlist: newPlaylist })
        }
        closeDropdown()
    }, [closeDropdown, playback, context])

    const handleAddToQueue = useCallback(
        (item: MediaItem) => {
            const playlist = playback.currentPlaylist
            const newPlaylist = [...playlist, item]
            playback.setCurrentPlaylist({ playlist: newPlaylist })
            closeDropdown()
        },
        [closeDropdown, playback]
    )

    // Actually working
    const handleViewAlbum = useCallback(
        (item: MediaItem) => {
            closeDropdown()

            if (item.AlbumId) {
                navigate(`/album/${item.AlbumId}`)
            }
        },
        [closeDropdown, navigate]
    )

    const handleViewArtist = useCallback(
        (artistId: string | undefined) => {
            closeDropdown()

            if (artistId) {
                navigate(`/artist/${artistId}`)
            }
        },
        [closeDropdown, navigate]
    )

    const menuItems = useMemo(() => {
        return {
            next: (
                <div
                    className="dropdown-item play-next"
                    onClick={() => handlePlayNext()}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Play next</span>
                </div>
            ),
            add_to_queue: (
                <div
                    className="dropdown-item add-queue"
                    onClick={() => handleAddToQueue(context!.item)}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Add to queue</span>
                </div>
            ),
            instant_mix: (
                <div
                    className="dropdown-item instant-mix"
                    onClick={() => {
                        if (!context) return

                        closeDropdown()

                        api.getInstantMixFromSong(context.item.Id).then(r => {
                            if (r) {
                                playback.setCurrentPlaylist({ playlist: r })
                                navigate('/queue')
                            }
                        })
                    }}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Play instant mix</span>
                </div>
            ),
            view_artists: (
                <div
                    className={`dropdown-item view-artists has-sub-menu${
                        subDropdown.isOpen && subDropdown.type === 'view-artists' ? ' active' : ''
                    }`}
                    onMouseEnter={e => openSubDropdown('view-artists', e)}
                >
                    <span>View artists</span>
                    <ChevronRightIcon size={12} className="icon" />
                    {subDropdown.isOpen && subDropdown.type === 'view-artists' && (
                        <div
                            ref={subMenuRef}
                            className={`sub-dropdown${subDropdown.flipY ? ' flip-y' : ''}`}
                            style={{
                                top: subDropdown.flipY ? 'auto' : `${subDropdown.top}px`,
                                bottom: subDropdown.flipY ? `${subDropdown.height - subDropdown.top}px` : 'auto',
                                left: `${subDropdown.width}px`,
                            }}
                        >
                            <div className="dropdown-menu">
                                {context?.item?.ArtistItems?.map(artist => (
                                    <div
                                        key={artist.Id}
                                        className="dropdown-item"
                                        onClick={() => handleViewArtist(artist.Id)}
                                    >
                                        {artist.Name || 'Unknown Artist'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
            view_artist: (
                <div
                    className="dropdown-item view-artist"
                    onClick={() => handleViewArtist(context?.item?.ArtistItems?.[0].Id)}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>View artist</span>
                </div>
            ),
            view_album: (
                <div
                    className="dropdown-item view-album"
                    onClick={() => handleViewAlbum(context!.item)}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>View album</span>
                </div>
            ),
            add_to_favorite: (
                <div
                    className="dropdown-item add-favorite"
                    onClick={async () => {
                        closeDropdown()

                        if (context) {
                            await addToFavorites(context.item)
                        }
                    }}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Add to favorites</span>
                </div>
            ),
            remove_from_favorite: (
                <div
                    className="dropdown-item remove-favorite has-removable"
                    onClick={async () => {
                        closeDropdown()

                        if (context) {
                            await removeFromFavorites(context.item)
                        }
                    }}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Remove from favorites</span>
                </div>
            ),
            add_to_playlist: (
                <div
                    className={`dropdown-item add-playlist has-sub-menu${
                        subDropdown.isOpen && subDropdown.type === 'add-playlist' ? ' active' : ''
                    }`}
                    onMouseEnter={e => openSubDropdown('add-playlist', e)}
                >
                    <span>Add to playlist</span>
                    <ChevronRightIcon size={12} className="icon" />
                    {subDropdown.isOpen && subDropdown.type === 'add-playlist' && (
                        <div
                            ref={subMenuRef}
                            className={`sub-dropdown${subDropdown.flipY ? ' flip-y' : ''}`}
                            style={{
                                top: subDropdown.flipY ? 'auto' : `${subDropdown.top}px`,
                                bottom: subDropdown.flipY ? `${subDropdown.height - subDropdown.top}px` : 'auto',
                                left: `${subDropdown.width}px`,
                            }}
                        >
                            <div className="dropdown-menu">
                                <div className="dropdown-item">
                                    <div className="playlist-input-container">
                                        <input
                                            value={playlistName}
                                            onChange={handleInputChange}
                                            onKeyDown={handleInputKeyDown}
                                            onClick={e => e.stopPropagation()}
                                            placeholder="New..."
                                            className={`playlist-input${playlistName.trim() ? ' has-text' : ''}`}
                                        />
                                        <button className="create-btn" onClick={handleCreateClick}>
                                            Create
                                        </button>
                                    </div>
                                </div>

                                {playlists.map(playlist => (
                                    <div
                                        key={playlist.Id}
                                        className="dropdown-item"
                                        onClick={() => {
                                            closeDropdown()
                                            api.addToPlaylist(playlist.Id, context!.item.Id)
                                        }}
                                    >
                                        {playlist.Name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
            remove_from_playlist: context?.playlistId ? (
                <div
                    className="dropdown-item remove-playlist has-removable"
                    onClick={() => {
                        closeDropdown()

                        if (context) {
                            api.removeFromPlaylist(context.playlistId!, context.item.Id)
                        }
                    }}
                    onMouseEnter={closeSubDropdown}
                >
                    <span>Remove from playlist</span>
                </div>
            ) : null,
        }
    }, [
        closeSubDropdown,
        subDropdown.isOpen,
        subDropdown.type,
        subDropdown.flipY,
        subDropdown.top,
        subDropdown.height,
        subDropdown.width,
        context,
        playlistName,
        handleInputKeyDown,
        handleCreateClick,
        playlists,
        handlePlayNext,
        handleAddToQueue,
        closeDropdown,
        api,
        playback,
        navigate,
        openSubDropdown,
        handleViewArtist,
        handleViewAlbum,
        addToFavorites,
        removeFromFavorites,
    ])

    const dropdownNode = useMemo(() => {
        return (
            <div
                className={'dropdown noSelect' + (isOpen ? ' active' : '')}
                style={{
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                    bottom: 'auto',
                }}
                ref={menuRef}
            >
                <div className="dropdown-menu">
                    {!hidden?.next && menuItems.next}
                    {!hidden?.add_to_queue && menuItems.add_to_queue}
                    {!hidden?.instant_mix && menuItems.instant_mix}

                    {(context?.item?.ArtistItems?.length || 0) > 1 && (
                        <>{!hidden?.view_artists && menuItems.view_artists}</>
                    )}

                    {(context?.item?.ArtistItems?.length || 0) === 1 && (
                        <>{!hidden?.view_artist && menuItems.view_artist}</>
                    )}

                    {!hidden?.view_album && menuItems.view_album}

                    {!context?.item?.UserData?.IsFavorite && (
                        <>{!hidden?.add_to_favorite && menuItems.add_to_favorite}</>
                    )}

                    {context?.item?.UserData?.IsFavorite && (
                        <>{!hidden?.remove_from_favorite && menuItems.remove_from_favorite}</>
                    )}

                    {!hidden?.add_to_playlist && menuItems.add_to_playlist}

                    {!hidden?.remove_from_playlist && menuItems.remove_from_playlist}
                </div>
            </div>
        )
    }, [
        isOpen,
        position.y,
        position.x,
        hidden?.next,
        hidden?.add_to_queue,
        hidden?.instant_mix,
        hidden?.view_artists,
        hidden?.view_artist,
        hidden?.view_album,
        hidden?.add_to_favorite,
        hidden?.remove_from_favorite,
        hidden?.add_to_playlist,
        hidden?.remove_from_playlist,
        menuItems.next,
        menuItems.add_to_queue,
        menuItems.instant_mix,
        menuItems.view_artists,
        menuItems.view_artist,
        menuItems.view_album,
        menuItems.add_to_favorite,
        menuItems.remove_from_favorite,
        menuItems.add_to_playlist,
        menuItems.remove_from_playlist,
        context?.item?.ArtistItems?.length,
        context?.item?.UserData?.IsFavorite,
    ])

    const touchTimeoutRef = useRef<number | null>(null)

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLElement>, context: IContext) => {
            e.preventDefault()
            touchTimeoutRef.current = window.setTimeout(() => {
                const touch = e.touches[0]
                const x = touch.clientX
                const y = touch.clientY + window.pageYOffset
                openDropdown(context, x, y)
            }, 400)
        },
        [openDropdown]
    )

    const clearTouchTimer = useCallback(() => {
        if (touchTimeoutRef.current !== null) {
            clearTimeout(touchTimeoutRef.current)
            touchTimeoutRef.current = null
        }
    }, [])

    return {
        isOpen,
        position,
        selectedItem: context?.item,
        menuItems,
        subDropdown,
        isTouchDevice,
        openDropdown,
        closeDropdown,
        openSubDropdown,
        closeSubDropdown,
        ignoreMargin,
        onContextMenu: (e: React.MouseEvent<HTMLElement, MouseEvent>, context: IContext) => {
            e.preventDefault()
            const x = e.clientX
            const y = e.clientY + window.pageYOffset
            openDropdown(context, x, y)
        },
        onTouchStart: handleTouchStart,
        onTouchClear: clearTouchTimer,
        dropdownNode,
        setHidden,
    }
}

export const DropdownContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <DropdownContext.Provider value={initialState}>{children}</DropdownContext.Provider>
}
