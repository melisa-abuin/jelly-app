import MediaList from '../components/MediaList';
import { useJellyfinHomeData } from '../hooks/useJellyfinHomeData';

interface HomePageProps {
    user: { userId: string; username: string };
    serverUrl: string;
    token: string;
}

const Home = ({ user, serverUrl, token }: HomePageProps) => {
    const { recentlyPlayed, frequentlyPlayed, recentlyAdded, loading } = useJellyfinHomeData(
        serverUrl,
        user.userId,
        token
    );

    return (
        <div className="home-page">
            <div className="section">
                <div className="section_title">Recently Played</div>
                <div className="section_desc">Songs you queued up lately</div>
                <MediaList items={recentlyPlayed} type="song" loading={loading} serverUrl={serverUrl} />
            </div>
            <div className="section">
                <div className="section_title">Frequently Played</div>
                <div className="section_desc">Songs you listen to often</div>
                <MediaList items={frequentlyPlayed} type="song" loading={loading} serverUrl={serverUrl} />
            </div>
            <div className="section">
                <div className="section_title">Recently Added</div>
                <div className="section_desc">Albums recently added to the Library</div>
                <MediaList items={recentlyAdded} type="album" loading={loading} serverUrl={serverUrl} />
            </div>
        </div>
    );
};

export default Home;
