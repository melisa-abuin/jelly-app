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
            ? `${serverUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&maxWidth=256&maxHeight=256&format=webp`
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
                                        <div className="media-state">
                                            <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                            <div className="overlay">
                                                <div className="container">
                                                    <div className="play">
                                                        <div className="play-icon"></div>
                                                    </div>
                                                    <div className="pause">
                                                        <div className="pause-icon"></div>
                                                    </div>
                                                </div>
                                                <div className="play-state-animation">
                                                    <svg
                                                        width="28"
                                                        height="20"
                                                        viewBox="0 0 28 20"
                                                        className="sound-bars"
                                                    >
                                                        <rect
                                                            x="2"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar1"
                                                        ></rect>
                                                        <rect
                                                            x="6"
                                                            y="10"
                                                            width="2"
                                                            height="10"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar2"
                                                        ></rect>
                                                        <rect
                                                            x="10"
                                                            y="14"
                                                            width="2"
                                                            height="6"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar3"
                                                        ></rect>
                                                        <rect
                                                            x="14"
                                                            y="11"
                                                            width="2"
                                                            height="9"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar4"
                                                        ></rect>
                                                        <rect
                                                            x="18"
                                                            y="13"
                                                            width="2"
                                                            height="7"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar5"
                                                        ></rect>
                                                        <rect
                                                            x="22"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar6"
                                                        ></rect>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
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
                                <div className="empty">No recently played music.</div>
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
                                        <div className="media-state">
                                            <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                            <div className="overlay">
                                                <div className="container">
                                                    <div className="play">
                                                        <div className="play-icon"></div>
                                                    </div>
                                                    <div className="pause">
                                                        <div className="pause-icon"></div>
                                                    </div>
                                                </div>
                                                <div className="play-state-animation">
                                                    <svg
                                                        width="28"
                                                        height="20"
                                                        viewBox="0 0 28 20"
                                                        className="sound-bars"
                                                    >
                                                        <rect
                                                            x="2"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar1"
                                                        ></rect>
                                                        <rect
                                                            x="6"
                                                            y="10"
                                                            width="2"
                                                            height="10"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar2"
                                                        ></rect>
                                                        <rect
                                                            x="10"
                                                            y="14"
                                                            width="2"
                                                            height="6"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar3"
                                                        ></rect>
                                                        <rect
                                                            x="14"
                                                            y="11"
                                                            width="2"
                                                            height="9"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar4"
                                                        ></rect>
                                                        <rect
                                                            x="18"
                                                            y="13"
                                                            width="2"
                                                            height="7"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar5"
                                                        ></rect>
                                                        <rect
                                                            x="22"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar6"
                                                        ></rect>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
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
                                <div className="empty">No frequently played music.</div>
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
                                        <div className="media-state">
                                            <img src={getThumbnailUrl(item)} alt={item.Name} className="thumbnail" />
                                            <div className="overlay">
                                                <div className="container">
                                                    <div className="play">
                                                        <div className="play-icon"></div>
                                                    </div>
                                                    <div className="pause">
                                                        <div className="pause-icon"></div>
                                                    </div>
                                                </div>
                                                <div className="play-state-animation">
                                                    <svg
                                                        width="28"
                                                        height="20"
                                                        viewBox="0 0 28 20"
                                                        className="sound-bars"
                                                    >
                                                        <rect
                                                            x="2"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar1"
                                                        ></rect>
                                                        <rect
                                                            x="6"
                                                            y="10"
                                                            width="2"
                                                            height="10"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar2"
                                                        ></rect>
                                                        <rect
                                                            x="10"
                                                            y="14"
                                                            width="2"
                                                            height="6"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar3"
                                                        ></rect>
                                                        <rect
                                                            x="14"
                                                            y="11"
                                                            width="2"
                                                            height="9"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar4"
                                                        ></rect>
                                                        <rect
                                                            x="18"
                                                            y="13"
                                                            width="2"
                                                            height="7"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar5"
                                                        ></rect>
                                                        <rect
                                                            x="22"
                                                            y="12"
                                                            width="2"
                                                            height="8"
                                                            rx="1"
                                                            fill="#ffffff"
                                                            className="bar bar6"
                                                        ></rect>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="media-details">
                                            <div className="container">
                                                <div className="album-name">{item.Name}</div>
                                                <div className="artist">{item.AlbumArtist || 'Unknown Artist'}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <div className="empty">No recently added albums.</div>
                            )}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
