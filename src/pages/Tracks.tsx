import MediaList from '../components/MediaList';
import { useJellyfinTracksData } from '../hooks/useJellyfinTracksData';

interface TracksProps {
    user: { userId: string; username: string };
    serverUrl: string;
    token: string;
}

const Tracks = ({ user, serverUrl, token }: TracksProps) => {
    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinTracksData(serverUrl, user.userId, token);

    return (
        <div className="tracks-page">
            <MediaList
                items={allTracks}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
            />
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default Tracks;
