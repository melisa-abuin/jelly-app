import { useEffect, useState } from 'react';
import { getFrequentlyPlayed, getRecentlyAdded, getRecentlyPlayed } from '../api';
import Loader from '../components/Loader';

interface HomePageProps {
    user: { userId: string; username: string };
    serverUrl: string;
    token: string;
}

interface MediaItem {
    Id: string;
    Name: string;
    AlbumArtist?: string;
    Album?: string;
    Artists?: string[];
    Type: string;
    ImageTags?: { Primary?: string }; // For thumbnails
    PlayCount?: number; // For Frequently Played
}

const Home = ({ user, serverUrl, token }: HomePageProps) => {
    const [recentlyPlayed, setRecentlyPlayed] = useState<MediaItem[]>([]);
    const [frequentlyPlayed, setFrequentlyPlayed] = useState<MediaItem[]>([]);
    const [recentlyAdded, setRecentlyAdded] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!serverUrl || !token) {
            console.log('No serverUrl or token, showing loader');
            setLoading(true);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log('Fetching data from Jellyfin...');
                const [played, frequent, added] = await Promise.all([
                    getRecentlyPlayed(serverUrl, user.userId, token),
                    getFrequentlyPlayed(serverUrl, user.userId, token),
                    getRecentlyAdded(serverUrl, user.userId, token),
                ]);
                console.log('Fetched Recently Played:', played);
                console.log('Fetched Frequently Played:', frequent);
                console.log('Fetched Recently Added:', added);
                setRecentlyPlayed(played.filter(item => item.Type === 'Audio'));
                setFrequentlyPlayed(frequent.filter(item => item.Type === 'Audio'));
                setRecentlyAdded(added.filter(item => item.Type === 'MusicAlbum'));
            } catch (error) {
                console.error('Failed to fetch media:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverUrl, user.userId, token]);

    const getThumbnailUrl = (item: MediaItem) =>
        item.ImageTags?.Primary
            ? `${serverUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=80`
            : '/default-thumbnail.png'; // Fallback image

    return (
        <div className="home">
            {loading ? (
                <Loader />
            ) : (
                <>
                    <div className="section">
                        <div className="section_title">Recently Played</div>
                        <div className="section_desc">Songs you have recently listened to</div>
                        <ul className="media-list noSelect">
                            {recentlyPlayed.length > 0 ? (
                                recentlyPlayed.map(item => (
                                    <li key={item.Id} className="media-item">
                                        <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                        <div className="media-details">
                                            <span className="song-name">{item.Name}</span>
                                            <div className="container">
                                                <div className="artist">{item.Artists?.[0] || 'Unknown Artist'}</div>
                                                <div className="divider"></div>
                                                <div className="album">{item.Album || 'Unknown Album'}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p>No recently played music.</p>
                            )}
                        </ul>
                    </div>
                    <div className="section">
                        <div className="section_title">Frequently Played</div>
                        <div className="section_desc">Songs you listen to often</div>
                        <ul className="media-list noSelect">
                            {frequentlyPlayed.length > 0 ? (
                                frequentlyPlayed.map(item => (
                                    <li key={item.Id} className="media-item">
                                        <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                        <div className="media-details">
                                            <span className="song-name">{item.Name}</span>
                                            <div className="container">
                                                <div className="artist">{item.Artists?.[0] || 'Unknown Artist'}</div>
                                                <div className="divider"></div>
                                                <div className="album">{item.Album || 'Unknown Album'}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p>No frequently played music.</p>
                            )}
                        </ul>
                    </div>
                    <div className="section">
                        <div className="section_title">Recently Added</div>
                        <div className="section_desc">Albums recently added to the Library</div>
                        <ul className="media-list noSelect">
                            {recentlyAdded.length > 0 ? (
                                recentlyAdded.map(item => (
                                    <li key={item.Id} className="media-item">
                                        <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                        <div className="media-details">
                                            <div className="container">
                                                <div className="album-name">{item.Name}</div>
                                                <div className="artist">{item.AlbumArtist || 'Unknown Artist'}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p>No recently added albums.</p>
                            )}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
