import axios from 'axios';

const api = axios.create({
    timeout: 6000,
});

interface AuthResponse {
    AccessToken: string;
    User: { Id: string; Name: string };
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
                    'X-Emby-Authorization':
                        'MediaBrowser Client="Jellyfin Music Client", Device="Web", DeviceId="12345", Version="1.0.0"',
                },
            }
        );
        return {
            token: response.data.AccessToken,
            userId: response.data.User.Id,
            username: response.data.User.Name,
        };
    } catch (error) {
        throw new Error('Login failed: ' + (error as Error).message);
    }
};

interface MediaItem {
    Id: string;
    Name: string;
    AlbumArtist?: string;
    Album?: string;
    Artists?: string[];
    Type: string;
    ImageTags?: { Primary?: string };
    PlayCount?: number;
}

export const getRecentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=10`,
        { headers: { 'X-Emby-Token': token } }
    );
    console.log('Recently Played Raw Response:', response.data.Items);
    return response.data.Items;
};

export const getFrequentlyPlayed = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&IncludeItemTypes=Audio&Recursive=true&Limit=10`,
        { headers: { 'X-Emby-Token': token } }
    );
    console.log('Frequently Played Raw Response:', response.data.Items);
    return response.data.Items;
};

export const getRecentlyAdded = async (serverUrl: string, userId: string, token: string): Promise<MediaItem[]> => {
    const response = await api.get<{ Items: MediaItem[] }>(
        `${serverUrl}/Users/${userId}/Items?SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=MusicAlbum&Recursive=true&Limit=10`,
        { headers: { 'X-Emby-Token': token } }
    );
    console.log('Recently Added Raw Response:', response.data.Items);
    return response.data.Items;
};
