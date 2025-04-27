import { useCallback, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'

export interface DropdownMenuItem {
    label: string
    action?: (item: MediaItem) => void
    isInput?: boolean
    subItems?: {
        label: string
        action: (item: MediaItem) => void
        isInput?: boolean
        subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
    }[]
}

const activeDropdown: { current: string | null } = { current: null }

export const useDropdown = (
    item: MediaItem,
    menuItems: DropdownMenuItem[] = [],
    elementRef: React.RefObject<HTMLElement | null>
) => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const [subDropdown, setSubDropdown] = useState<{
        isOpen: boolean
        position: { x: number; y: number }
        items: {
            label: string
            action: (item: MediaItem) => void
            isInput?: boolean
            subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
        }[]
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

    useEffect(() => {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 480
        setIsTouchDevice(isTouch)
    }, [])

    const openDropdown = useCallback(
        (_item: MediaItem, x: number, y: number, _menuItems: DropdownMenuItem[]) => {
            let adjustedX = x
            let adjustedY = y
            if (isTouchDevice) {
                adjustedX = 0
                adjustedY = window.innerHeight
            } else if (elementRef.current) {
                const rect = elementRef.current.getBoundingClientRect()
                const menuWidth = 170
                const menuHeight = 160
                const margin = 20
                adjustedX = x + rect.left + menuWidth + margin > window.innerWidth ? x - menuWidth - margin : x
                adjustedY = y + rect.top + menuHeight + margin > window.innerHeight ? y - menuHeight - margin : y
            }
            const closeEvent = new CustomEvent('close-all-dropdowns', { detail: { exceptId: _item.Id } })
            document.dispatchEvent(closeEvent)
            activeDropdown.current = _item.Id
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
        [elementRef, isTouchDevice]
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
        if (activeDropdown.current === item.Id) {
            activeDropdown.current = null
        }
        setTimeout(() => {
            isClosing.current = false
        }, 0)
    }, [item.Id])

    const openSubDropdown = useCallback(
        (
            x: number,
            y: number,
            items: {
                label: string
                action: (item: MediaItem) => void
                isInput?: boolean
                subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
            }[],
            activeIndex: number,
            flip: boolean,
            flipY: boolean,
            top: number
        ) => {
            setSubDropdown({
                isOpen: false,
                position: { x: 0, y: 0 },
                items: [],
                activeIndex: null,
                flip: false,
                flipY: false,
                top: 0,
            })
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

        const handleCloseAllDropdowns = (e: Event) => {
            const customEvent = e as CustomEvent<{ exceptId: string }>
            if (customEvent.detail.exceptId !== item.Id) {
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
        position,
        subDropdown,
        isTouchDevice,
        openSubDropdown,
        closeSubDropdown,
        closeDropdown,
        onContextMenu: handleContextMenu,
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    }
}
