import { MediaItem } from '../api/jellyfin'

export const defaultMenuItems = (
    track: MediaItem,
    navigate: (path: string) => void,
    playback: any,
    api: any,
    playlists: any[]
) => {
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

    const menuItems: {
        label: string
        action?: (item: MediaItem) => void
        subItems?: { label: string; action: (item: MediaItem) => void; isInput?: boolean }[]
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
            label: 'Play instant mix',
            action: (item: MediaItem) => {
                api.getInstantMixFromSong(item.Id).then((r: any) => {
                    if (r) {
                        playback.setCurrentPlaylist({
                            playlist: r,
                        })
                        navigate('/queue')
                    }
                })
            },
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
            label: track.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites',
            action: handleToggleFavorite,
        },
        {
            label: 'Add to playlist',
            subItems: [
                {
                    label: 'New...',
                    action: () => {}, // Placeholder, handled by input
                    isInput: true,
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
