import { BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { ReactNode, useMemo, useState } from 'react'
import { FilterContext } from './FilterContext'
import { useLocation, useSearchParams } from 'react-router-dom'

export type IFilterContext = ReturnType<typeof useInitialState>

enum SortInitialState {
    Added = 'Added',
    Tracks = 'Tracks',
    Released = 'Released',
    Runtime = 'Runtime',
    Random = 'Random',
    Artists = 'Artists',
    Albums = 'Albums',
    None = ''
}

const pathToSortMap: Record<string, SortInitialState> = {
    '/tracks': SortInitialState.Added,
    '/albums': SortInitialState.Added,
    '/genre': SortInitialState.Added,
    '/favorites': SortInitialState.Tracks
}

const isValidSortValue = (val: string): val is SortInitialState => {
    return Object.values(SortInitialState)
        .map(v => v.toLowerCase())
        .includes(val.toLowerCase())
}


const useInitialState = () => {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const queryFilter = searchParams.get('filter')

    const filterFromQuery = queryFilter && isValidSortValue(queryFilter)
    ? (Object.values(SortInitialState).find(
        v => v.toLowerCase() === queryFilter.toLowerCase()
      ) as SortInitialState)
    : null

    const pathFallback = pathToSortMap[location.pathname] ?? SortInitialState.None

    const [sort, setSort] = useState<SortInitialState>(filterFromQuery || pathFallback)

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
