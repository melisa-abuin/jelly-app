import { BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { FilterContext } from './FilterContext'

export type IFilterContext = ReturnType<typeof useInitialState>

enum SortState {
    Added = 'Added',
    Tracks = 'Tracks',
    Released = 'Released',
    Runtime = 'Runtime',
    Random = 'Random',
    Artists = 'Artists',
    Albums = 'Albums',
    None = '',
}

const pathToSortMap: Record<string, SortState> = {
    '/tracks': SortState.Added,
    '/albums': SortState.Added,
    '/genre': SortState.Added,
    '/favorites': SortState.Tracks,
}

const isValidSortValue = (val: string): val is SortState => {
    return Object.values(SortState)
        .map(v => v.toLowerCase())
        .includes(val.toLowerCase())
}

const useInitialState = () => {
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const queryFilter = searchParams.get('type')

    const filterFromQuery =
        queryFilter && isValidSortValue(queryFilter)
            ? (Object.values(SortState).find(v => v.toLowerCase() === queryFilter.toLowerCase()) as SortState)
            : null

    const pathFallback = pathToSortMap[location.pathname] || SortState.None

    const [sort, _setSort] = useState<string>(filterFromQuery || pathFallback)

    const setSort = useCallback(
        (value: string) => {
            const params = new URLSearchParams()

            if (pathToSortMap[location.pathname] === value) {
                _setSort('')
            } else {
                params.set('type', value)
                _setSort(value)
            }

            setSearchParams(params)
        },
        [location.pathname, setSearchParams]
    )

    useEffect(() => {
        const currentSort = searchParams.get('type') || pathFallback

        _setSort(isValidSortValue(currentSort) ? currentSort : SortState.None)
    }, [searchParams, pathFallback, _setSort])

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
