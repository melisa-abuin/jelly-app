import { ___PAGE_PARAM_INDEX___ } from '../../../components/PlaybackManager'
import { useFilterContext } from '../../../context/FilterContext/FilterContext'
import { useJellyfinContext } from '../../../context/JellyfinContext/JellyfinContext'
import { useJellyfinInfiniteData } from './useJellyfinInfiniteData'

export const useJellyfinFavoritesData = () => {
    const api = useJellyfinContext()
    const itemsPerPage = 40
    const { jellySort, jellyItemKind } = useFilterContext()

    return useJellyfinInfiniteData({
        queryKey: ['favorites', jellySort.sortBy, jellySort.sortOrder, jellyItemKind],
        queryFn: async ({ pageParam = 0 }) => {
            const startIndex = (pageParam as number) * itemsPerPage
            return await api.getFavoriteTracks(
                startIndex,
                itemsPerPage,
                jellySort.sortBy,
                jellySort.sortOrder,
                jellyItemKind
            )
        },
        queryFnReviver: {
            fn: 'getFavoriteTracks',
            params: [___PAGE_PARAM_INDEX___, itemsPerPage, jellySort.sortBy, jellySort.sortOrder, jellyItemKind],
        },
    })
}
