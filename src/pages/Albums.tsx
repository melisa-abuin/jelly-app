import MediaList from '../components/MediaList';
import { useJellyfinAlbumsData } from '../hooks/useJellyfinAlbumsData';

interface AlbumsProps {
    user: { userId: string; username: string };
    serverUrl: string;
    token: string;
}

const Albums = ({ user, serverUrl, token }: AlbumsProps) => {
    const { allAlbums, loading, error, loadMore, hasMore } = useJellyfinAlbumsData(serverUrl, user.userId, token);

    return (
        <div className="albums-page">
            <MediaList
                items={allAlbums}
                type="album"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
            />
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default Albums;
