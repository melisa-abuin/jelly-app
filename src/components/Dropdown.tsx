import { ChevronRightIcon } from '@primer/octicons-react'
import { useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { DropdownMenuItem } from '../hooks/useDropdown'
import './Dropdown.css'

interface DropdownProps {
    isOpen: boolean
    position: { x: number; y: number }
    selectedItem: MediaItem | null
    menuItems: DropdownMenuItem[]
    subDropdown: {
        isOpen: boolean
        position: { x: number; y: number }
        items: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
        activeIndex: number | null
        flip: boolean
        flipY: boolean
        top: number
    }
    openSubDropdown: (
        x: number,
        y: number,
        items: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[],
        activeIndex: number,
        flip: boolean,
        flipY: boolean,
        top: number
    ) => void
    closeSubDropdown: () => void
    closeDropdown: () => void
    parentRef: React.RefObject<HTMLElement | null>
}

export const Dropdown = ({
    isOpen,
    position,
    selectedItem,
    menuItems,
    subDropdown,
    openSubDropdown,
    closeSubDropdown,
    closeDropdown,
    parentRef,
}: DropdownProps) => {
    const menuRef = useRef<HTMLDivElement>(null)
    const subMenuRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [subMenuHeight, setSubMenuHeight] = useState<number>(0)
    const [playlistName, setPlaylistName] = useState<string>('')

    useEffect(() => {
        if (isOpen && parentRef.current) {
            console.log('Dropdown opened for track item:', parentRef.current)
        }
    }, [isOpen, parentRef])

    useEffect(() => {
        if (subDropdown.isOpen && subMenuRef.current) {
            const menuElement = subMenuRef.current.querySelector('.dropdown-menu') as HTMLElement | null
            const height = menuElement?.offsetHeight || 0
            setSubMenuHeight(height)
        }
        if (subDropdown.isOpen && subDropdown.items.some(item => item.isInput)) {
            inputRef.current?.focus()
        }
    }, [subDropdown.isOpen, subDropdown.items])

    const handleItemClick = (e: React.MouseEvent, menuItem: DropdownMenuItem, menuIndex: number) => {
        e.stopPropagation()
        if (menuItem.subItems) {
            const menuItemElement = menuRef.current?.querySelectorAll('.dropdown-item')[menuIndex]
            if (menuItemElement) {
                const rect = menuItemElement.getBoundingClientRect()
                const menuWidth = rect.width
                const menuHeight = subMenuHeight || 160
                const margin = 20
                const cssTopOffset = -4
                const viewportBottom = window.innerHeight + window.scrollY
                const flip = rect.left + menuWidth * 2 + margin > window.innerWidth
                const flipY = rect.top + window.scrollY + cssTopOffset + menuHeight + 40 > viewportBottom
                let top = cssTopOffset
                if (flipY) {
                    top = -menuHeight // Align with bottom when flipped
                } else if (rect.top + window.scrollY + cssTopOffset + menuHeight + margin > viewportBottom) {
                    top = cssTopOffset - (menuHeight - (viewportBottom - rect.bottom - margin))
                }
                console.log('Opening submenu for:', menuItem.label, 'Subitems:', menuItem.subItems)
                openSubDropdown(0, 0, menuItem.subItems, menuIndex, flip, flipY, top)
            }
        } else if (menuItem.action && selectedItem) {
            console.log('Executing action for:', menuItem.label)
            menuItem.action(selectedItem)
            closeDropdown()
        }
    }

    const handleSubItemClick = (
        e: React.MouseEvent,
        subItem: { label: string; action: (item: MediaItem) => void; isInput?: boolean }
    ) => {
        e.stopPropagation()
        if (!subItem.isInput && selectedItem) {
            console.log('Executing subitem action for:', subItem.label)
            subItem.action(selectedItem)
            closeDropdown()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlaylistName(e.target.value)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && playlistName.trim() && selectedItem) {
            console.log('Create new playlist:', playlistName, 'for item:', selectedItem.Name)
            setPlaylistName('')
            closeDropdown()
        }
    }

    const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (playlistName.trim() && selectedItem) {
            console.log('Create new playlist:', playlistName, 'for item:', selectedItem.Name)
            setPlaylistName('')
            closeDropdown()
        }
    }

    const handleMouseEnter = (menuItem: DropdownMenuItem, menuIndex: number) => {
        if (menuItem.subItems && menuRef.current) {
            const menuItemElement = menuRef.current.querySelectorAll('.dropdown-item')[menuIndex]
            if (menuItemElement) {
                const rect = menuItemElement.getBoundingClientRect()
                const menuWidth = rect.width
                const menuHeight = subMenuHeight || 160
                const margin = 20
                const cssTopOffset = -4
                const viewportBottom = window.innerHeight + window.scrollY
                const flip = rect.left + menuWidth * 2 + margin > window.innerWidth
                const flipY = rect.top + window.scrollY + cssTopOffset + menuHeight + 40 > viewportBottom
                let top = cssTopOffset
                if (flipY) {
                    top = -menuHeight // Align with bottom when flipped
                } else if (rect.top + window.scrollY + cssTopOffset + menuHeight + margin > viewportBottom) {
                    top = cssTopOffset - (menuHeight - (viewportBottom - rect.bottom - margin))
                }
                console.log('Mouse enter submenu for:', menuItem.label)
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
        e.stopPropagation() // Prevent clicks in empty dropdown space from bubbling
    }

    return isOpen ? (
        <div
            className={`dropdown noSelect`}
            style={{
                top: position.y,
                left: position.x,
            }}
            ref={menuRef}
            onContextMenu={handleContextMenu}
            onClick={handleDropdownClick}
        >
            <div className="dropdown-menu">
                {menuItems.map((menuItem, index) => (
                    <div
                        key={index}
                        className={`dropdown-item${menuItem.subItems ? ' has-sub-menu' : ''}${
                            menuItem.label === 'Remove from favorites' ? ' remove-favorite' : ''
                        }`}
                        onClick={e => handleItemClick(e, menuItem, index)}
                        onMouseEnter={() => handleMouseEnter(menuItem, index)}
                        onMouseLeave={closeSubDropdown}
                    >
                        <span>{menuItem.label}</span>
                        {menuItem.subItems && <ChevronRightIcon size={12} className="icon" />}
                        {subDropdown.isOpen && subDropdown.activeIndex === index && (
                            <div
                                className={`sub-dropdown${subDropdown.flip ? ' flip' : ''}${
                                    subDropdown.flipY ? ' flip-y' : ''
                                }`}
                                style={{
                                    top: subDropdown.top,
                                    left: subDropdown.position.x,
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
                                                        className="playlist-input"
                                                    />
                                                    {playlistName.trim() && (
                                                        <button onClick={handleSaveClick} className="save-button">
                                                            Save
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                subItem.label
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ) : null
}
