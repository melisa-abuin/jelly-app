import { createContext, Dispatch, SetStateAction } from 'react'
import { MediaItem } from '../../api/jellyfin'
import { DropdownMenuItem } from '../../hooks/useDropdown'

export interface DropdownContextType {
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
    isTouchDevice: boolean
    openDropdown: (item: MediaItem, x: number, y: number, menuItems: DropdownMenuItem[]) => void
    closeDropdown: () => void
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
    activeElementId: string | null
    setActiveElementId: Dispatch<SetStateAction<string | null>>
}

export const DropdownContext = createContext<DropdownContextType | null>(null)
