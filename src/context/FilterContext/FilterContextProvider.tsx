import { BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { ReactNode, useMemo, useState } from 'react'
import { FilterContext } from './FilterContext'

export type IFilterContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [sort, setSort] = useState(
        location.pathname === '/tracks' || location.pathname === '/albums' || location.pathname === '/genre'
            ? 'Added'
            : location.pathname === '/favorites'
            ? 'Tracks'
            : ''
    )

    const jellySort = useMemo(() => {
        let newSortBy: ItemSortBy[]
        let newSortOrder: SortOrder[] = [SortOrder.Ascending]

        switch (sort) {
            case 'Added':
                newSortBy = [ItemSortBy.DateCreated]
                newSortOrder = [SortOrder.Descending]
                break
            case 'Released':
                newSortBy = [ItemSortBy.PremiereDate]
                break
            case 'Runtime':
                newSortBy = [ItemSortBy.Runtime]
                break
            case 'Random':
                newSortBy = [ItemSortBy.Random]
                break
            default:
                newSortBy = [ItemSortBy.DateCreated]
                newSortOrder = [SortOrder.Descending]
        }

        return { sortBy: newSortBy, sortOrder: newSortOrder }
    }, [sort])

    const jellyItemKind = useMemo(() => {
        switch (sort) {
            case 'Artists':
                return BaseItemKind.MusicArtist
            case 'Albums':
                return BaseItemKind.MusicAlbum
            default:
                return BaseItemKind.Audio
        }
    }, [sort])

    return {
        sort,
        setSort,
        jellySort,
        jellyItemKind,
    }
}

export const FilterContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <FilterContext.Provider value={initialState}>{children}</FilterContext.Provider>
}
