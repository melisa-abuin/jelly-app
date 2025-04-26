import { useNavigate } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinPlaylistsList } from '../hooks/useJellyfinPlaylistsList'

export const defaultMenuItems = (track: MediaItem) => {
    const navigate = useNavigate()
    const { playlists } = useJellyfinPlaylistsList()

    // Placeholders
    const handlePlayNext = (item: MediaItem) => {
        console.log('Play next:', item.Name)
    }

    const handleAddToQueue = (item: MediaItem) => {
        console.log('Add to queue:', item.Name)
    }

    const handleToggleFavorite = (item: MediaItem) => {
        if (item.UserData?.IsFavorite) {
            console.log('Remove from favorites:', item.Name)
        } else {
            console.log('Add to favorites:', item.Name)
        }
    }

    // Actually working
    const handleViewAlbum = (item: MediaItem) => {
        if (item.AlbumId) {
            navigate(`/album/${item.AlbumId}`)
        }
    }

    const handleViewArtist = (artistId: string | undefined) => {
        if (artistId) {
            navigate(`/artist/${artistId}`)
        }
    }

    // Placeholders
    const handleAddToPlaylist = (playlistId: string, item: MediaItem) => {
        console.log(`Add to playlist ${playlistId}:`, item.Name)
    }

    const handleAddToNewPlaylist = (item: MediaItem) => {
        console.log('Add to new playlist:', item.Name)
    }

    const menuItems: {
        label: string
        action?: (item: MediaItem) => void
        subItems?: { label: string; action: (item: MediaItem) => void }[]
    }[] = [
        {
            label: 'Play next',
            action: handlePlayNext,
        },
        {
            label: 'Add to queue',
            action: handleAddToQueue,
        },
        {
            label: track.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites',
            action: handleToggleFavorite,
        },
        track.ArtistItems && track.ArtistItems.length > 1
            ? {
                  label: 'View artists',
                  subItems: track.ArtistItems.map(artist => ({
                      label: artist.Name || 'Unknown Artist',
                      action: () => handleViewArtist(artist.Id),
                  })),
              }
            : {
                  label: 'View artist',
                  action: (item: MediaItem) =>
                      handleViewArtist(item.ArtistItems?.[0]?.Id ?? item.AlbumArtist ?? undefined),
              },
        {
            label: 'View album',
            action: handleViewAlbum,
        },
        {
            label: 'Add to playlist',
            subItems: [
                {
                    label: 'New...',
                    action: handleAddToNewPlaylist,
                },
                ...playlists.map(playlist => ({
                    label: playlist.Name || 'Unnamed Playlist',
                    action: (item: MediaItem) => handleAddToPlaylist(playlist.Id, item),
                })),
            ],
        },
    ]

    return menuItems
}
