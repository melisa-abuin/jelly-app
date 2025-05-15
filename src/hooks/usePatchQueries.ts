import { useQueryClient } from '@tanstack/react-query'
import { MediaItem } from '../api/jellyfin'

const isPages = (data: object): data is { pages: MediaItem[][] } => {
    return 'pages' in data && !!data.pages
}

const isMediaItem = (data: object): data is MediaItem => {
    return 'Id' in data && !!data.Id
}

const patchData = (data: unknown, itemId: string, patch: IPatch): unknown => {
    if (!data) return data

    if (Array.isArray(data)) {
        return data.map(item => patchData(item, itemId, patch))
    }

    if (typeof data === 'object') {
        if (isMediaItem(data) && data.Id === itemId) {
            return patch(data)
        }

        if (isPages(data)) {
            return {
                ...data,
                pages: data.pages.map(page => patchData(page, itemId, patch)),
            }
        }
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

                queryClient.setQueryData(query.queryKey, patchData(data, mediaItemId, patch))
            }
        },
        prependItemToQueryData: (queryKey: string, item: MediaItem) => {
            const allQueries = queryClient.getQueryCache().findAll()

            for (const query of allQueries) {
                const data = query.state.data

                if (!data) continue
                if (query.queryKey[0] !== queryKey) continue

                if (isPages(data)) {
                    const [first, ...pages] = data.pages

                    query.setData({
                        ...data,
                        pages: [[item, ...first], ...pages],
                    })
                } else {
                    query.setData([item, ...(data as MediaItem[])])
                }
            }
        },
        removeItemFromQueryData: (queryKey: string, itemId: string) => {
            const allQueries = queryClient.getQueryCache().findAll()

            for (const query of allQueries) {
                const data = query.state.data

                if (!data) continue
                if (query.queryKey[0] !== queryKey) continue

                if (isPages(data)) {
                    query.setData({
                        ...data,
                        pages: data.pages.map(page => page.filter((item: MediaItem) => item.Id !== itemId)),
                    })
                } else {
                    query.setData((data as MediaItem[]).filter(item => item.Id !== itemId))
                }
            }
        },
    }
}
