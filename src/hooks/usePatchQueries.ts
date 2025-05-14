import { useQueryClient } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'

const patchFavoriteInData = (data: any, itemId: string, patch: IPatch): any => {
    if (!data) return data

    if (Array.isArray(data)) {
        return data.map(item => patchFavoriteInData(item, itemId, patch))
    }

    if (typeof data === 'object') {
        if (data.Id === itemId) {
            return patch(data)
        }

        const newData: any = {}

        for (const key in data) {
            newData[key] = patchFavoriteInData(data[key], itemId, patch)
        }

        return newData
    }

    return data
}

type IPatch = (item: MediaItem) => MediaItem

export const usePatchQueries = () => {
    const queryClient = useQueryClient()

    return {
        patchMediaItem: (mediaItemId: string, patch: IPatch) => {
            const allQueries = queryClient.getQueryCache().findAll()

            for (const query of allQueries) {
                const data = query.state.data

                if (!data) continue

                queryClient.setQueryData(query.queryKey, patchFavoriteInData(data, mediaItemId, patch))
            }
        },
    }
}
