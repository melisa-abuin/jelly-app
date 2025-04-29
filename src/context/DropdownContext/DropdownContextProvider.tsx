import { ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { DropdownMenuItem } from '../../hooks/useDropdown'
import { ScrollContext } from '../ScrollContext/ScrollContext'
import { DropdownContext } from './DropdownContext'

interface DropdownProviderProps {
    children: ReactNode
}

export const DropdownProvider = ({ children }: DropdownProviderProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
    const [menuItems, setMenuItems] = useState<DropdownMenuItem[]>([])
    const [subDropdown, setSubDropdown] = useState<{
        isOpen: boolean
        position: { x: number; y: number }
        items: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
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
    const [activeElementId, setActiveElementId] = useState<string | null>(null)
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const scrollContext = useContext(ScrollContext)

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
        (item: MediaItem, x: number, y: number, items: DropdownMenuItem[]) => {
            let adjustedX = x
            let adjustedY = y
            if (isTouchDevice) {
                adjustedX = 0
                adjustedY = window.innerHeight
            } else {
                const menuWidth = 170
                const menuHeight = 160
                const margin = 10
                const container = document.querySelector('.interface') || document.body
                const containerRect = container.getBoundingClientRect()
                const containerWidth = containerRect.width
                // Adjusted to keep menu within the container's bounds
                adjustedX = x + menuWidth + margin > containerWidth ? containerWidth - menuWidth - margin : x
                adjustedY =
                    y + menuHeight + margin > document.documentElement.clientHeight
                        ? document.documentElement.clientHeight - menuHeight - margin
                        : y
            }
            setIsOpen(true)
            setPosition({ x: adjustedX, y: adjustedY })
            setSelectedItem(item)
            setMenuItems(items)
            setSubDropdown({
                isOpen: false,
                position: { x: 0, y: 0 },
                items: [],
                activeIndex: null,
                flip: false,
                flipY: false,
                top: 0,
            })
            setActiveElementId(item.Id)
        },
        [isTouchDevice]
    )

    const closeDropdown = useCallback(() => {
        // Delay state reset to allow fade-out animation attempt...
        setTimeout(() => {
            setIsOpen(false)
            setPosition({ x: 0, y: 0 })
            setSelectedItem(null)
            setMenuItems([])
            setSubDropdown({
                isOpen: false,
                position: { x: 0, y: 0 },
                items: [],
                activeIndex: null,
                flip: false,
                flipY: false,
                top: 0,
            })
            setActiveElementId(null)
        }, 200)
    }, [])

    const openSubDropdown = useCallback(
        (
            x: number,
            y: number,
            items: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[],
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

    return (
        <DropdownContext.Provider
            value={{
                isOpen,
                position,
                selectedItem,
                menuItems,
                subDropdown,
                isTouchDevice,
                openDropdown,
                closeDropdown,
                openSubDropdown,
                closeSubDropdown,
                activeElementId,
                setActiveElementId,
            }}
        >
            {children}
        </DropdownContext.Provider>
    )
}
