import { ChevronRightIcon } from '@primer/octicons-react'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../../api/jellyfin'
import { useJellyfinContext } from '../JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../PlaybackContext/PlaybackContext'
import { useScrollContext } from '../ScrollContext/ScrollContext'
import { DropdownContext } from './DropdownContext'

export interface DropdownMenuItem {
    label: string
    action?: (item: MediaItem) => void
    subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
}

interface DropdownProviderProps {
    children: ReactNode
}

export type IDropdownContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
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
    const [hidden, setHidden] = useState<{ [x in keyof typeof menuItems]: boolean }>()
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const playback = usePlaybackContext()

    const subMenuRef = useRef<HTMLDivElement>(null)

    const menuRef = useRef<HTMLDivElement>(null)

    const [playlistName, setPlaylistName] = useState<string>('')

    const closeSubDropdown = useCallback(() => {
        setSubDropdown(prev => ({ ...prev, isOpen: false, type: '' }))
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPlaylistName(e.target.value)
    const handleInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && playlistName.trim() && selectedItem) {
                // api.createPlaylist(playlistName.trim())
                //     .then(id => api.addItemToPlaylist(id, dropdown.selectedItem!.Id))
                //     .then(() => {
                //         setPlaylistName('')
                //         closeSubDropdown()
                //         dropdown.closeDropdown()
                //     })
            } else if (e.key === 'Escape') {
                setPlaylistName('')
                closeSubDropdown()
            }
        },
        [closeSubDropdown, playlistName, selectedItem]
    )

    const handleCreateClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            if (playlistName.trim() && selectedItem) {
                // api.createPlaylist(playlistName.trim())
                //     .then(id => api.addItemToPlaylist(id, dropdown.selectedItem!.Id))
                //     .then(() => {
                //         setPlaylistName('')
                //         closeSubDropdown()
                //         dropdown.closeDropdown()
                //     })
            }
        },
        [playlistName, selectedItem]
    )

    const closeDropdown = useCallback(() => {
        setIsOpen(false)
        setSelectedItem(null)
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
            const margin = 8
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
        if (scrollContext) {
            scrollContext.setDisabled(isOpen && isTouchDevice)
        }
    }, [isOpen, isTouchDevice, scrollContext])

    const openDropdown = useCallback(
        (item: MediaItem, x: number, y: number, ignoreMargin = false) => {
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
            setSelectedItem(item)
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

    const handlePlayNext = (item: MediaItem) => {
        console.log('Play next:', item.Name)
    }

    const handleAddToQueue = (item: MediaItem) => {
        console.log('Add to queue:', item.Name)
    }

    const handleToggleFavorite = (item: MediaItem) => {
        if (item.UserData?.IsFavorite) {
            console.log('Remove from favorites:', item.Name)
        } else {
            console.log('Add to favorites:', item.Name)
        }
    }

    // Actually working
    const handleViewAlbum = useCallback(
        (item: MediaItem) => {
            if (item.AlbumId) {
                navigate(`/album/${item.AlbumId}`)
            }
        },
        [navigate]
    )

    const handleViewArtist = useCallback(
        (artistId: string | undefined) => {
            if (artistId) {
                navigate(`/artist/${artistId}`)
            }
        },
        [navigate]
    )

    // Placeholders
    const handleAddToPlaylist = (playlistId: string, item: MediaItem) => {
        console.log(`Add to playlist ${playlistId}:`, item.Name)
    }

    const menuItems = useMemo(() => {
        return {
            next: (
                <div className="dropdown-item play-next" onClick={() => handlePlayNext(selectedItem!)}>
                    <span>Play next</span>
                </div>
            ),
            add_to_queue: (
                <div className="dropdown-item add-queue" onClick={() => handleAddToQueue(selectedItem!)}>
                    <span>Add to queue</span>
                </div>
            ),
            instant_mix: (
                <div
                    className="dropdown-item instant-mix"
                    onClick={() => {
                        if (!selectedItem) return

                        closeDropdown()

                        api.getInstantMixFromSong(selectedItem.Id).then(r => {
                            if (r) {
                                playback.setCurrentPlaylist({
                                    playlist: r,
                                })
                                navigate('/queue')
                            }
                        })
                    }}
                >
                    <span>Play instant mix</span>
                </div>
            ),
            view_artists: (
                <div
                    className="dropdown-item view-artists has-sub-menu"
                    onMouseEnter={e => openSubDropdown('view-artists', e)}
                    onMouseLeave={closeSubDropdown}
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
                                {selectedItem?.ArtistItems?.map(artist => (
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
            view_album: (
                <div className="dropdown-item view-album" onClick={() => handleViewAlbum(selectedItem!)}>
                    <span>View album</span>
                </div>
            ),
            add_to_favorite: (
                <div className="dropdown-item add-favorite" onClick={() => handleToggleFavorite(selectedItem!)}>
                    <span>Add to favorites</span>
                </div>
            ),
            remove_from_favorite: (
                <div
                    className="dropdown-item remove-favorite has-removable"
                    onClick={() => handleToggleFavorite(selectedItem!)}
                >
                    <span>Remove from favorites</span>
                </div>
            ),
            add_to_playlist: (
                <div
                    className="dropdown-item add-playlist has-sub-menu"
                    onMouseEnter={e => openSubDropdown('add-playlist', e)}
                    onMouseLeave={closeSubDropdown}
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
                                <div className="dropdown-item" onClick={() => handleAddToPlaylist(playlist.id, item)}>
                                    Playlist 1
                                </div>
                                <div className="dropdown-item">Playlist 2</div>
                            </div>
                        </div>
                    )}
                </div>
            ),
        }
    }, [
        api,
        closeDropdown,
        closeSubDropdown,
        handleCreateClick,
        handleInputKeyDown,
        handleViewAlbum,
        handleViewArtist,
        navigate,
        openSubDropdown,
        playback,
        playlistName,
        selectedItem,
        subDropdown.flipY,
        subDropdown.height,
        subDropdown.isOpen,
        subDropdown.top,
        subDropdown.type,
        subDropdown.width,
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
                    {!hidden?.view_artists && menuItems.view_artists}
                    {!hidden?.view_album && menuItems.view_album}
                    {!hidden?.add_to_favorite && menuItems.add_to_favorite}
                    {!hidden?.remove_from_favorite && menuItems.remove_from_favorite}
                    {!hidden?.add_to_playlist && menuItems.add_to_playlist}
                </div>
            </div>
        )
    }, [
        isOpen,
        menuItems.add_to_favorite,
        menuItems.add_to_playlist,
        menuItems.add_to_queue,
        menuItems.instant_mix,
        menuItems.next,
        menuItems.remove_from_favorite,
        menuItems.view_album,
        menuItems.view_artists,
        position.x,
        position.y,
        hidden?.add_to_favorite,
        hidden?.add_to_playlist,
        hidden?.add_to_queue,
        hidden?.instant_mix,
        hidden?.next,
        hidden?.remove_from_favorite,
        hidden?.view_album,
        hidden?.view_artists,
    ])

    return {
        isOpen,
        position,
        selectedItem,
        setSelectedItem,
        menuItems,
        subDropdown,
        isTouchDevice,
        openDropdown,
        closeDropdown,
        openSubDropdown,
        closeSubDropdown,
        ignoreMargin,
        onContextMenu: (e: React.MouseEvent<HTMLLIElement, MouseEvent>, item: MediaItem) => {
            e.preventDefault()

            if (selectedItem?.Id === item.Id) {
                closeDropdown()
                return
            }

            const x = e.clientX
            const y = e.clientY + window.pageYOffset
            openDropdown(item, x, y)
        },
        onTouchStart: (e: React.TouchEvent<HTMLLIElement>, item: MediaItem) => {
            e.preventDefault()

            if (selectedItem?.Id === item.Id) {
                closeDropdown()
                return
            }

            const touch = e.touches[0]
            const x = touch.clientX
            const y = touch.clientY + window.pageYOffset
            openDropdown(item, x, y)
        },
        onTouchEnd: () => {
            closeDropdown()
        },
        dropdownNode,
        setVisible: setHidden,
    }
}

export const DropdownContextProvider = ({ children }: DropdownProviderProps) => {
    const initialState = useInitialState()

    return <DropdownContext.Provider value={initialState}>{children}</DropdownContext.Provider>
}
