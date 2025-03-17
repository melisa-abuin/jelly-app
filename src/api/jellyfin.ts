import axios from 'axios'
import axiosRetry from 'axios-retry'

// Generate a unique DeviceId for each client
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
    retryDelay: retryCount => retryCount * 1000, // 1s, 2s, 3s delay between retries
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
                    'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Music Client", Device="Web", DeviceId="${deviceId}", Version="1.0.0"`,
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
    Id: string
    Name: string
    Album?: string
    AlbumArtist?: string
    AlbumArtists?: any[]
    AlbumId?: string
    AlbumPrimaryImageTag?: string
    ArtistItems?: any[]
    Artists?: string[]
    Type: string
    ImageTags?: { Primary?: string }
    DateCreated?: string
    PlayCount?: number
    UserData?: { IsFavorite: boolean }
}

export const getRecentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=10&Fields=PrimaryImageAspectRatio,ParentId,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getFrequentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=10&Fields=PrimaryImageAspectRatio,ParentId,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getRecentlyAdded = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&Limit=10&Fields=PrimaryImageAspectRatio,ParentId,ImageTags`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getAllAlbums = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 20
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&StartIndex=${startIndex}&Limit=${limit}`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getAllTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 20
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&StartIndex=${startIndex}&Limit=${limit}`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}

export const getFavoriteTracks = async (
    serverUrl: string,
    userId: string,
    token: string,
    startIndex = 0,
    limit = 20
): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?Filters=IsFavorite&IncludeItemTypes=Audio&Recursive=true&SortBy=DateCreated&SortOrder=Descending&StartIndex=${startIndex}&Limit=${limit}`,
        { headers: { 'X-Emby-Token': token } }
    )
    return response.data.Items
}
