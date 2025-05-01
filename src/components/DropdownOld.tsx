import { ChevronRightIcon } from '@primer/octicons-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { DropdownContext } from '../context/DropdownContext/DropdownContext'
import './Dropdown.css'

export const Dropdown = () => {
    const context = useContext(DropdownContext)

    if (!context) {
        throw new Error('Dropdown must be used within a DropdownProvider')
    }

    const {
        isOpen,
        position,
        selectedItem,
        menuItems,
        subDropdown,
        isTouchDevice,
        openSubDropdown,
        closeSubDropdown,
        closeDropdown,
    } = context

    const menuRef = useRef<HTMLDivElement>(null)
    const subMenuRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [subMenuHeight, setSubMenuHeight] = useState<number>(0)
    const [playlistName, setPlaylistName] = useState<string>('')
    const [isInputActive, setIsInputActive] = useState<boolean>(false)
    const [animationPhase, setAnimationPhase] = useState<'open' | 'closing' | 'closed'>('closed')

    const isMobile = isTouchDevice ?? window.innerWidth <= 480

    useEffect(() => {
        if (subDropdown.isOpen && subMenuRef.current) {
            const menuElement = subMenuRef.current.querySelector('.dropdown-menu') as HTMLElement | null
            const height = menuElement?.offsetHeight || 0
            setSubMenuHeight(height)
        }
        if (subDropdown.isOpen && (!isMobile || isInputActive)) {
            inputRef.current?.focus()
        }
    }, [subDropdown.isOpen, isMobile, isInputActive])

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null

        if (isOpen && animationPhase !== 'open') {
            setAnimationPhase('open')
        } else if (!isOpen && animationPhase === 'open') {
            setAnimationPhase('closing')
            timer = setTimeout(() => {
                setAnimationPhase('closed')
            }, 200) // Match fade-out animation duration, attempt...
        }

        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [isOpen])

    const handleItemClick = (e: React.MouseEvent, menuItem: any, menuIndex: number) => {
        e.stopPropagation()
        if (menuItem.subItems) {
            if (isMobile) {
                openSubDropdown(0, 0, menuItem.subItems, menuIndex, false, false, 0)
            } else {
                const menuItemElement = menuRef.current?.querySelectorAll('.dropdown-item')[menuIndex]
                if (menuItemElement) {
                    const rect = menuItemElement.getBoundingClientRect()
                    const menuWidth = rect.width
                    const menuHeight = subMenuHeight || 180
                    const margin = 40
                    const cssTopOffset = 0
                    const viewportBottom = window.innerHeight + window.pageYOffset
                    const viewportRight = window.innerWidth
                    const flip = rect.left + menuWidth + margin + menuWidth > viewportRight
                    const flipY = rect.top + window.pageYOffset + cssTopOffset + menuHeight + margin > viewportBottom
                    let top = cssTopOffset
                    if (flipY) {
                        top = -menuHeight + rect.height
                    }
                    openSubDropdown(0, 0, menuItem.subItems, menuIndex, flip, flipY, top)
                }
            }
        } else if (menuItem.action && selectedItem) {
            menuItem.action(selectedItem)
            closeDropdown()
        }
    }

    const handleSubItemClick = (
        e: React.MouseEvent,
        subItem: { label: string; action: (item: MediaItem) => void; isInput?: boolean }
    ) => {
        e.stopPropagation()
        if (subItem.isInput && isMobile) {
            setIsInputActive(true)
        } else if (!subItem.isInput && selectedItem) {
            subItem.action(selectedItem)
            closeDropdown()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlaylistName(e.target.value)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && playlistName.trim() && selectedItem) {
            setPlaylistName('')
            setIsInputActive(false)
            closeDropdown()
        } else if (e.key === 'Escape') {
            setPlaylistName('')
            setIsInputActive(false)
        }
    }

    const handleCreateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (playlistName.trim() && selectedItem) {
            setPlaylistName('')
            setIsInputActive(false)
            closeDropdown()
        }
    }

    const handleMouseEnter = (menuItem: any, menuIndex: number) => {
        if (isMobile) return
        if (menuItem.subItems && menuRef.current) {
            const menuItemElement = menuRef.current.querySelectorAll('.dropdown-item')[menuIndex]
            if (menuItemElement) {
                const rect = menuItemElement.getBoundingClientRect()
                const menuWidth = rect.width
                const menuHeight = subMenuHeight || 180
                const margin = 40
                const cssTopOffset = 0
                const viewportBottom = window.innerHeight + window.pageYOffset
                const viewportRight = window.innerWidth
                const flip = rect.left + menuWidth + margin + menuWidth > viewportRight
                const flipY = rect.top + window.pageYOffset + cssTopOffset + menuHeight + margin > viewportBottom
                let top = cssTopOffset
                if (flipY) {
                    top = -menuHeight + rect.height
                }
                openSubDropdown(0, 0, menuItem.subItems, menuIndex, flip, flipY, top)
            }
        } else {
            closeSubDropdown()
        }
    }

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
    }

    return (
        <div
            className={`dropdown noSelect${isMobile ? ' drawer' : ''} ${
                animationPhase === 'open' ? 'active' : animationPhase === 'closing' ? 'closing' : 'closing'
            }`}
            style={{
                top: isMobile ? 'auto' : `${position.y}px`,
                left: isMobile ? 0 : `${position.x}px`,
                bottom: isMobile ? 0 : 'auto',
            }}
            ref={menuRef}
            onContextMenu={handleContextMenu}
            onClick={handleDropdownClick}
        >
            {(animationPhase === 'open' || animationPhase === 'closing') && (
                <div className="dropdown-menu">
                    {(subDropdown.isOpen && isMobile ? subDropdown.items : menuItems).map((item, index) => (
                        <div
                            key={index}
                            className={`dropdown-item${(item as any).subItems && !isMobile ? ' has-sub-menu' : ''}${
                                item.label === 'Remove from favorites' ? ' has-removable' : ''
                            }`}
                            onClick={e => handleItemClick(e, item, index)}
                            onMouseEnter={() => handleMouseEnter(item, index)}
                            onMouseLeave={isMobile ? undefined : closeSubDropdown}
                        >
                            {(item as any).isInput ? (
                                <div className="playlist-input-container">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={playlistName}
                                        onChange={handleInputChange}
                                        onKeyDown={handleInputKeyDown}
                                        onClick={e => e.stopPropagation()}
                                        placeholder={item.label}
                                        className={`playlist-input${playlistName.trim() ? ' has-text' : ''}`}
                                    />
                                    <button onClick={handleCreateClick} className="create-btn">
                                        Create
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span>{item.label}</span>
                                    {(item as any).subItems && <ChevronRightIcon size={12} className="icon" />}
                                </>
                            )}
                            {subDropdown.isOpen &&
                                subDropdown.activeIndex === index &&
                                !isMobile &&
                                (() => {
                                    const menuItemElement = menuRef.current?.querySelectorAll('.dropdown-item')[index]
                                    const rect = menuItemElement?.getBoundingClientRect()
                                    return rect ? (
                                        <div
                                            className={`sub-dropdown${subDropdown.flip ? ' flip' : ''}${
                                                subDropdown.flipY ? ' flip-y' : ''
                                            }`}
                                            style={{
                                                top: subDropdown.flipY ? 'auto' : `${subDropdown.top}px`,
                                                bottom: subDropdown.flipY
                                                    ? `${rect.height - subDropdown.top}px`
                                                    : 'auto',
                                                left: subDropdown.flip ? 'auto' : `${rect.width}px`,
                                                right: subDropdown.flip ? `${rect.width}px` : 'auto',
                                            }}
                                            ref={subMenuRef}
                                        >
                                            <div className="dropdown-menu">
                                                {subDropdown.items.map((subItem, subIndex) => (
                                                    <div
                                                        key={subIndex}
                                                        className="dropdown-item"
                                                        onClick={e => handleSubItemClick(e, subItem)}
                                                        onContextMenu={handleContextMenu}
                                                    >
                                                        {subItem.isInput ? (
                                                            <div className="playlist-input-container">
                                                                <input
                                                                    ref={inputRef}
                                                                    type="text"
                                                                    value={playlistName}
                                                                    onChange={handleInputChange}
                                                                    onKeyDown={handleInputKeyDown}
                                                                    onClick={e => e.stopPropagation()}
                                                                    placeholder={subItem.label}
                                                                    className={`playlist-input${
                                                                        playlistName.trim() ? ' has-text' : ''
                                                                    }`}
                                                                />
                                                                <button
                                                                    onClick={handleCreateClick}
                                                                    className="create-btn"
                                                                >
                                                                    Create
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            subItem.label
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null
                                })()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
