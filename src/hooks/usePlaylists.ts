import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePatchQueries } from './usePatchQueries'

export const usePlaylists = () => {
    const api = useJellyfinContext()
    const { prependItemToQueryData, removeItemFromQueryData } = usePatchQueries()

    return {
        addToPlaylist: async (item: MediaItem, playlistId: string) => {
            await api.addToPlaylist(playlistId, item.Id)
            prependItemToQueryData(['playlistTracks', playlistId], item)
        },
        removeFromPlaylist: async (item: MediaItem, playlistId: string) => {
            await api.removeFromPlaylist(playlistId, item.Id)
            removeItemFromQueryData(['playlistTracks', playlistId], item.Id)
        },
        createPlaylist: async (name: string) => {
            const res = await api.createPlaylist(name)
            const playlist = await api.getPlaylist(res.Id!)
            prependItemToQueryData(['playlists'], playlist)
            return playlist
        },
    }
}
