import { useCallback, useContext, useEffect, useRef } from 'react'
import { MediaItem } from '../api/jellyfin'
import { DropdownContext } from '../context/DropdownContext/DropdownContext'

export interface DropdownMenuItem {
    label: string
    action?: (item: MediaItem) => void
    subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
}

export const useDropdown = (
    item: MediaItem,
    menuItems: DropdownMenuItem[] = [],
    elementRef: React.RefObject<HTMLElement | null>
) => {
    const context = useContext(DropdownContext)
    if (!context) {
        throw new Error('useDropdown must be used within a DropdownProvider')
    }

    const { isOpen, openDropdown, closeDropdown, setSelectedItem } = context
    const touchTimeout = useRef<number | null>(null)

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault()
            if (elementRef.current) {
                const x = e.clientX
                const y = e.clientY + window.pageYOffset
                const closeEvent = new CustomEvent('close-all-dropdowns', { detail: { exceptId: item.Id } })
                document.dispatchEvent(closeEvent)
                openDropdown(item, x, y, menuItems)
                setSelectedItem(item)
            }
        },
        [item, menuItems, openDropdown, elementRef, setSelectedItem]
    )

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLElement>) => {
            touchTimeout.current = window.setTimeout(() => {
                if (elementRef.current) {
                    const touch = e.touches[0]
                    const x = touch.clientX
                    const y = touch.clientY + window.pageYOffset
                    const closeEvent = new CustomEvent('close-all-dropdowns', { detail: { exceptId: item.Id } })
                    document.dispatchEvent(closeEvent)
                    openDropdown(item, x, y, menuItems)
                    setSelectedItem(item)
                }
            }, 500)
        },
        [item, menuItems, openDropdown, elementRef, setSelectedItem]
    )

    const handleTouchEnd = useCallback(() => {
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current)
            touchTimeout.current = null
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!isOpen) return
            const target = e.target as Node
            // Only close if clicking outside both the dropdown and the triggering element
            if (
                elementRef.current &&
                !elementRef.current.contains(target) &&
                e.target instanceof Element &&
                !e.target.closest('.dropdown, .sub-dropdown')
            ) {
                closeDropdown()
            }
        }

        const handleCloseAllDropdowns = (e: Event) => {
            const customEvent = e as CustomEvent<{ exceptId: string }>
            // Only close if the event is not for the current item
            if (customEvent.detail.exceptId !== item.Id && isOpen) {
                closeDropdown()
            }
        }

        document.addEventListener('click', handleClickOutside)
        document.addEventListener('close-all-dropdowns', handleCloseAllDropdowns)

        return () => {
            document.removeEventListener('click', handleClickOutside)
            document.removeEventListener('close-all-dropdowns', handleCloseAllDropdowns)
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current)
            }
        }
    }, [closeDropdown, elementRef, isOpen, item.Id])

    return {
        isOpen,
        onContextMenu: handleContextMenu,
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    }
}
