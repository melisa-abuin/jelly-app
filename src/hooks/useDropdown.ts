import { useCallback, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'

export interface DropdownMenuItem {
    label: string
    action?: (item: MediaItem) => void
    subItems?: { label: string; action: (item: MediaItem) => void }[]
}

export const useDropdown = (
    item: MediaItem,
    menuItems: DropdownMenuItem[] = [],
    elementRef: React.RefObject<HTMLElement | null>
) => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [subDropdown, setSubDropdown] = useState<{
        isOpen: boolean
        position: { x: number; y: number }
        items: { label: string; action: (item: MediaItem) => void }[]
        activeIndex: number | null
        flip: boolean
        flipY: boolean
        top: number
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        items: [],
        activeIndex: null,
        flip: false,
        flipY: false,
        top: 0,
    })
    const touchTimeout = useRef<number | null>(null)
    const isClosing = useRef(false)

    const openDropdown = useCallback(
        (_item: MediaItem, x: number, y: number, _menuItems: DropdownMenuItem[]) => {
            const menuWidth = 160
            const menuHeight = 160
            const margin = 20
            let adjustedX = x
            let adjustedY = y
            if (elementRef.current) {
                const rect = elementRef.current.getBoundingClientRect()
                adjustedX =
                    x + rect.left > window.innerWidth - menuWidth - margin
                        ? window.innerWidth - menuWidth - margin - rect.left
                        : x
                adjustedY =
                    y + rect.top > window.innerHeight - menuHeight - margin
                        ? window.innerHeight - menuHeight - margin - rect.top
                        : y
            }
            setIsOpen(true)
            setPosition({ x: adjustedX, y: adjustedY })
            setSubDropdown({
                isOpen: false,
                position: { x: 0, y: 0 },
                items: [],
                activeIndex: null,
                flip: false,
                flipY: false,
                top: 0,
            })
        },
        [elementRef]
    )

    const closeDropdown = useCallback(() => {
        if (isClosing.current) return
        isClosing.current = true
        setIsOpen(false)
        setPosition({ x: 0, y: 0 })
        setSubDropdown({
            isOpen: false,
            position: { x: 0, y: 0 },
            items: [],
            activeIndex: null,
            flip: false,
            flipY: false,
            top: 0,
        })
        setTimeout(() => {
            isClosing.current = false
        }, 0)
    }, [])

    const openSubDropdown = useCallback(
        (
            x: number,
            y: number,
            items: { label: string; action: (item: MediaItem) => void }[],
            activeIndex: number,
            flip: boolean,
            flipY: boolean,
            top: number
        ) => {
            setSubDropdown({ isOpen: true, position: { x, y }, items, activeIndex, flip, flipY, top })
        },
        []
    )

    const closeSubDropdown = useCallback(() => {
        if (subDropdown.isOpen) {
            setSubDropdown({
                isOpen: false,
                position: { x: 0, y: 0 },
                items: [],
                activeIndex: null,
                flip: false,
                flipY: false,
                top: 0,
            })
        }
    }, [subDropdown.isOpen])

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault()
            if (elementRef.current) {
                const rect = elementRef.current.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                openDropdown(item, x, y, menuItems)
            }
        },
        [item, menuItems, openDropdown, elementRef]
    )

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLElement>) => {
            touchTimeout.current = window.setTimeout(() => {
                if (elementRef.current) {
                    const touch = e.touches[0]
                    const rect = elementRef.current.getBoundingClientRect()
                    const x = touch.clientX - rect.left
                    const y = touch.clientY - rect.top
                    openDropdown(item, x, y, menuItems)
                }
            }, 500)
        },
        [item, menuItems, openDropdown, elementRef]
    )

    const handleTouchEnd = useCallback(() => {
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current)
            touchTimeout.current = null
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isClosing.current || !isOpen) return
            const target = e.target as Node
            if (
                elementRef.current &&
                !elementRef.current.contains(target) &&
                e.target instanceof Element &&
                !e.target.closest('.dropdown, .sub-dropdown')
            ) {
                closeDropdown()
            }
        }

        document.addEventListener('click', handleClickOutside)

        return () => {
            document.removeEventListener('click', handleClickOutside)
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current)
            }
        }
    }, [closeDropdown, elementRef, isOpen])

    return {
        isOpen,
        position,
        subDropdown,
        openSubDropdown,
        closeSubDropdown,
        closeDropdown,
        onContextMenu: handleContextMenu,
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    }
}
