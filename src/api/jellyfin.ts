import axios from 'axios'
import axiosRetry from 'axios-retry'

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

const api = axios.create({
    timeout: 20000,
})

axiosRetry(api, {
    retries: 3,
    retryDelay: retryCount => retryCount * 1000,
    retryCondition: error => {
        return axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.response?.status === 503)
    },
})

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
        const response = await api.post<AuthResponse>(
            `${serverUrl}/Users/AuthenticateByName`,
            { Username: username, Pw: password },
            {
                headers: {
                    'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Music App", Device="Web", DeviceId="${deviceId}", Version="0.1"`,
                },
            }
        )
        return {
            token: response.data.AccessToken,
            userId: response.data.User.Id,
            username: response.data.User.Name,
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
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getFrequentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getRecentlyAdded = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&Limit=12&Fields=PrimaryImageAspectRatio,ParentId,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getAllAlbums = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&StartIndex=${startIndex}&Limit=${limit}&Fields=ChildCount,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getAllTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&StartIndex=${startIndex}&Limit=${limit}&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getFavoriteTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?Filters=IsFavorite&IncludeItemTypes=Audio&Recursive=true&SortBy=DateCreated&SortOrder=Descending&StartIndex=${startIndex}&Limit=${limit}&Fields=ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getAlbumDetails = async (
    serverUrl: string,
    userId: string,
    token: string,
    albumId: string
): Promise<{ album: MediaItem; tracks: MediaItem[] }> => {
    const albumResponse = await api.get<MediaItem>(
        `${serverUrl}/Users/${userId}/Items/${albumId}?Fields=ChildCount,ImageTags,DateCreated,PremiereDate,AlbumArtists`,
        { headers: { 'X-Emby-Token': token } }
    )
    const album = albumResponse.data

    const tracksResponse = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?ParentId=${albumId}&IncludeItemTypes=Audio&SortBy=IndexNumber&SortOrder=Ascending&Fields=RunTimeTicks,ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    const tracks = tracksResponse.data.Items

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
    const artistResponse = await api.get<MediaItem>(`${serverUrl}/Users/${userId}/Items/${artistId}?Fields=ImageTags`, {
        headers: { 'X-Emby-Token': token },
    })
    const artist = artistResponse.data

    const tracksResponse = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Fields=RunTimeTicks,ParentId,ImageTags,ArtistItems&Limit=${trackLimit}`,
        { headers: { 'X-Emby-Token': token } }
    )
    const tracks = tracksResponse.data.Items

    const totalTracksResponse = await api.get<{ TotalRecordCount: number }>(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=Audio&Recursive=true&Limit=0`,
        { headers: { 'X-Emby-Token': token } }
    )
    const totalTrackCount = totalTracksResponse.data.TotalRecordCount

    const artistAlbumsResponse = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ChildCount,ImageTags,PremiereDate,Genres,AlbumArtists&SortBy=PremiereDate,ProductionYear,SortName&SortOrder=Descending`,
        { headers: { 'X-Emby-Token': token } }
    )
    const artistAlbums = artistAlbumsResponse.data.Items

    const contributingAlbumsResponse = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?ContributingArtistIds=${artistId}&IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ChildCount,ImageTags,PremiereDate,Genres,AlbumArtists&SortBy=PremiereDate,ProductionYear,SortName&SortOrder=Descending`,
        { headers: { 'X-Emby-Token': token } }
    )
    const contributingAlbums = contributingAlbumsResponse.data.Items

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
    const playlistsResponse = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?IncludeItemTypes=Playlist&Recursive=true&Fields=ChildCount,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    const playlists = playlistsResponse.data.Items

    const playlistsWithArtist: MediaItem[] = []

    const batchSize = 5
    for (let i = 0; i < playlists.length; i += batchSize) {
        const batch = playlists.slice(i, i + batchSize)
        const batchPromises = batch.map(async playlist => {
            let allTracks: MediaItem[] = []
            let startIndex = 0
            const limit = 100

            while (true) {
                const tracksResponse = await api.get<{ Items: MediaItem[]; TotalRecordCount: number }>(
                    `${serverUrl}/Users/${userId}/Items?ParentId=${playlist.Id}&IncludeItemTypes=Audio&Fields=ArtistItems&StartIndex=${startIndex}&Limit=${limit}`,
                    { headers: { 'X-Emby-Token': token } }
                )
                const tracks = tracksResponse.data.Items
                allTracks = allTracks.concat(tracks)

                const hasArtist = tracks.some(track => track.ArtistItems?.some(artist => artist.Id === artistId))
                if (hasArtist) {
                    return playlist
                }

                if (startIndex + limit >= tracksResponse.data.TotalRecordCount) {
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
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Genres=${encodeURIComponent(
            genre
        )}&StartIndex=${startIndex}&Limit=${limit}&Fields=PrimaryImageAspectRatio,ParentId,ImageTags,ArtistItems`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items || []
}

export const getPlaylist = async (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string
): Promise<MediaItem> => {
    const playlistResponse = await api.get<MediaItem>(
        `${serverUrl}/Users/${userId}/Items/${playlistId}?Fields=ChildCount,ImageTags,DateCreated`,
        { headers: { 'X-Emby-Token': token } }
    )
    return playlistResponse.data
}

export const getPlaylistTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    playlistId: string,
    startIndex = 0,
    limit = 40
): Promise<MediaItem[]> => {
    const tracksResponse = await api.get<{ Items: MediaItem[]; TotalRecordCount: number }>(
        `${serverUrl}/Users/${userId}/Items?ParentId=${playlistId}&IncludeItemTypes=Audio&SortBy=DateCreated&SortOrder=Descending&Fields=RunTimeTicks,ArtistItems,ImageTags,DateCreated&StartIndex=${startIndex}&Limit=${limit}`,
        { headers: { 'X-Emby-Token': token } }
    )
    return tracksResponse.data.Items
}

export { api, axios }

export const getAllPlaylists = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?IncludeItemTypes=Playlist&Recursive=true&Fields=Name`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}
