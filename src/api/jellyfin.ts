export class ApiError extends Error {
    constructor(message: string, public response: Response) {
        super(message)
        this.response = response
    }
}

const generateDeviceId = () => {
    const storedDeviceId = localStorage.getItem('deviceId')
    if (storedDeviceId) {
        return storedDeviceId
    }
    const newDeviceId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('deviceId', newDeviceId)
    return newDeviceId
}

const deviceId = generateDeviceId()

interface AuthResponse {
    AccessToken: string
    User: { Id: string; Name: string }
}

export const loginToJellyfin = async (
    serverUrl: string,
    username: string,
    password: string
): Promise<{ token: string; userId: string; username: string }> => {
    try {
        const response = await fetch(`${serverUrl}/Users/AuthenticateByName`, {
            method: 'POST',
            headers: {
                'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Music App", Device="Web", DeviceId="${deviceId}", Version="0.1"`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Username: username, Pw: password }),
            signal: AbortSignal.timeout(20000),
        })
        if (!response.ok) {
            throw new ApiError(`HTTP error! status: ${response.status}`, response)
        }
        const data: AuthResponse = await response.json()
        return {
            token: data.AccessToken,
            userId: data.User.Id,
            username: data.User.Name,
        }
    } catch (error) {
        throw new Error('Login failed: ' + (error as Error).message)
    }
}

export interface MediaItem {
    Genres?: string[]
    Id: string
    Name: string
    Album?: string
    AlbumArtist?: string
    AlbumArtists?: Array<{ Id: string; Name: string }>
    AlbumId?: string
    AlbumPrimaryImageTag?: string
    ArtistItems?: Array<{ Id: string; Name: string }>
    Artists?: string[]
    Type: string
    ImageTags?: { Primary?: string }
    DateCreated?: string
    PremiereDate?: string
    PlayCount?: number
    UserData?: { IsFavorite: boolean; PlayCount?: number }
    RunTimeTicks?: number
    ChildCount?: number
}

export const getRecentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getFrequentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getRecentlyAdded = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getAllAlbums = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&StartIndex=${startIndex}&Limit=${limit}&Fields=ChildCount,ImageTags`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getAllTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&StartIndex=${startIndex}&Limit=${limit}&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getFavoriteTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?Filters=IsFavorite&IncludeItemTypes=Audio&Recursive=true&SortBy=DateCreated&SortOrder=Descending&StartIndex=${startIndex}&Limit=${limit}&Fields=ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getAlbumDetails = async (
    serverUrl: string,
    userId: string,
    token: string,
    albumId: string
): Promise<{ album: MediaItem; tracks: MediaItem[] }> => {
    const albumResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items/${albumId}?Fields=ChildCount,ImageTags,DateCreated,PremiereDate,AlbumArtists`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!albumResponse.ok) throw new Error(`HTTP error! status: ${albumResponse.status}`)
    const album: MediaItem = await albumResponse.json()

    const tracksResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?ParentId=${albumId}&IncludeItemTypes=Audio&SortBy=IndexNumber&SortOrder=Ascending&Fields=RunTimeTicks,ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!tracksResponse.ok) throw new Error(`HTTP error! status: ${tracksResponse.status}`)
    const tracksData: { Items: MediaItem[] } = await tracksResponse.json()
    const tracks: MediaItem[] = tracksData.Items

    return { album, tracks }
}

export const getArtistDetails = async (
    serverUrl: string,
    userId: string,
    token: string,
    artistId: string,
    trackLimit = 5
): Promise<{
    artist: MediaItem
    tracks: MediaItem[]
    albums: MediaItem[]
    appearsInAlbums: MediaItem[]
    totalTrackCount: number
}> => {
    const artistResponse = await fetch(`${serverUrl}/Users/${userId}/Items/${artistId}?Fields=ImageTags`, {
        headers: { 'X-Emby-Token': token },
        signal: AbortSignal.timeout(20000),
    })
    if (!artistResponse.ok) throw new Error(`HTTP error! status: ${artistResponse.status}`)
    const artist: MediaItem = await artistResponse.json()

    const tracksResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Fields=RunTimeTicks,ParentId,ImageTags,ArtistItems&Limit=${trackLimit}`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!tracksResponse.ok) throw new Error(`HTTP error! status: ${tracksResponse.status}`)
    const tracksData: { Items: MediaItem[] } = await tracksResponse.json()
    const tracks: MediaItem[] = tracksData.Items

    const totalTracksResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Limit=0`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!totalTracksResponse.ok) throw new Error(`HTTP error! status: ${totalTracksResponse.status}`)
    const totalTracksData: { TotalRecordCount: number } = await totalTracksResponse.json()
    const totalTrackCount: number = totalTracksData.TotalRecordCount

    const artistAlbumsResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ChildCount,ImageTags,PremiereDate,Genres,AlbumArtists&SortBy=PremiereDate,ProductionYear,SortName&SortOrder=Descending`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!artistAlbumsResponse.ok) throw new Error(`HTTP error! status: ${artistAlbumsResponse.status}`)
    const artistAlbumsData: { Items: MediaItem[] } = await artistAlbumsResponse.json()
    const artistAlbums: MediaItem[] = artistAlbumsData.Items

    const contributingAlbumsResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?ContributingArtistIds=${artistId}&IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ChildCount,ImageTags,PremiereDate,Genres,AlbumArtists&SortBy=PremiereDate,ProductionYear,SortName&SortOrder=Descending`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!contributingAlbumsResponse.ok) throw new Error(`HTTP error! status: ${contributingAlbumsResponse.status}`)
    const contributingAlbumsData: { Items: MediaItem[] } = await contributingAlbumsResponse.json()
    const contributingAlbums: MediaItem[] = contributingAlbumsData.Items

    const allAlbumsMap = new Map<string, MediaItem>()
    artistAlbums.forEach(album => allAlbumsMap.set(album.Id, album))
    contributingAlbums.forEach(album => allAlbumsMap.set(album.Id, album))
    const allAlbums = Array.from(allAlbumsMap.values())

    const albums: MediaItem[] = []
    const appearsInAlbums: MediaItem[] = []

    allAlbums.forEach(album => {
        const primaryAlbumArtist = album.AlbumArtists?.[0]?.Name || album.AlbumArtist || 'Unknown Artist'
        if (primaryAlbumArtist === artist.Name) {
            albums.push(album)
        } else {
            appearsInAlbums.push(album)
        }
    })

    return { artist, tracks, albums, appearsInAlbums, totalTrackCount }
}

export const getPlaylistsFeaturingArtist = async (
    serverUrl: string,
    userId: string,
    token: string,
    artistId: string
): Promise<MediaItem[]> => {
    const playlistsResponse = await fetch(
        `${serverUrl}/Users/${userId}/Items?IncludeItemTypes=Playlist&Recursive=true&Fields=ChildCount,ImageTags`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!playlistsResponse.ok) throw new Error(`HTTP error! status: ${playlistsResponse.status}`)
    const playlistsData: { Items: MediaItem[] } = await playlistsResponse.json()
    const playlists = playlistsData.Items

    const playlistsWithArtist: MediaItem[] = []
    const batchSize = 5

    for (let i = 0; i < playlists.length; i += batchSize) {
        const batch = playlists.slice(i, i + batchSize)
        const batchPromises = batch.map(async playlist => {
            let startIndex = 0
            const limit = 100

            while (true) {
                const tracksResponse = await fetch(
                    `${serverUrl}/Users/${userId}/Items?ParentId=${playlist.Id}&IncludeItemTypes=Audio&Fields=ArtistItems&StartIndex=${startIndex}&Limit=${limit}`,
                    {
                        headers: { 'X-Emby-Token': token },
                        signal: AbortSignal.timeout(20000),
                    }
                )
                if (!tracksResponse.ok) throw new Error(`HTTP error! status: ${tracksResponse.status}`)
                const tracksData: { Items: MediaItem[]; TotalRecordCount: number } = await tracksResponse.json()
                const tracks: MediaItem[] = tracksData.Items
                const hasArtist = tracks.some(track => track.ArtistItems?.some(artist => artist.Id === artistId))
                if (hasArtist) {
                    return playlist
                }
                if (startIndex + limit >= tracksData.TotalRecordCount) {
                    break
                }
                startIndex += limit
            }
            return null
        })
        const results = await Promise.all(batchPromises)
        playlistsWithArtist.push(...results.filter((result): result is MediaItem => result !== null))
    }

    return playlistsWithArtist
}

export const getGenreTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    genre: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Genres=${encodeURIComponent(
            genre
        )}&StartIndex=${startIndex}&Limit=${limit}&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items || []
}

export const getPlaylist = async (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string
): Promise<MediaItem> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items/${playlistId}?Fields=ChildCount,ImageTags,DateCreated`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const playlist: MediaItem = await response.json()
    return playlist
}

export const getPlaylistTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?ParentId=${playlistId}&IncludeItemTypes=Audio&SortBy=DateCreated&SortOrder=Descending&Fields=RunTimeTicks,ArtistItems,ImageTags,DateCreated&StartIndex=${startIndex}&Limit=${limit}`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const getAllPlaylists = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?IncludeItemTypes=Playlist&Recursive=true&Fields=Name`,
        {
            headers: { 'X-Emby-Token': token },
            signal: AbortSignal.timeout(20000),
        }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const fetchAllTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    artistId: string
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Fields=RunTimeTicks,UserData`,
        { headers: { 'X-Emby-Token': token }, signal: AbortSignal.timeout(20000) }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    const data: { Items: MediaItem[] } = await response.json()
    return data.Items
}

export const fetchPlaylistMetadata = async (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string
): Promise<{ Items: MediaItem[]; TotalRecordCount: number }> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?ParentId=${playlistId}&IncludeItemTypes=Audio&Fields=RunTimeTicks,UserData`,
        { headers: { 'X-Emby-Token': token }, signal: AbortSignal.timeout(20000) }
    )
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`, response)
    return response.json()
}

export const fetchRecentlyPlayed = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex: number,
    limit: number
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&IncludeItemTypes=Audio&Filters=IsPlayed&Recursive=true&Fields=BasicSyncInfo,PrimaryImageAspectRatio,MediaSourceCount,MediaStreams&Limit=${limit}&StartIndex=${startIndex}&api_key=${token}`
    )
    if (!response.ok) {
        throw new ApiError('Failed to fetch recently played items', response)
    }
    const data = await response.json()
    return data.Items || []
}

export const fetchFrequentlyPlayed = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex: number,
    limit: number
): Promise<MediaItem[]> => {
    const response = await fetch(
        `${serverUrl}/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&IncludeItemTypes=Audio&Filters=IsPlayed&Recursive=true&Fields=BasicSyncInfo,PrimaryImageAspectRatio,MediaSourceCount,MediaStreams&Limit=${limit}&StartIndex=${startIndex}&api_key=${token}`
    )
    if (!response.ok) {
        throw new ApiError('Failed to fetch frequently played items', response)
    }
    const data = await response.json()
    return data.Items || []
}
