import MediaList from '../components/MediaList'
import { useJellyfinFavoritesData } from '../hooks/useJellyfinFavoritesData'

interface FavoritesProps {
    user: { userId: string; username: string }
    serverUrl: string
    token: string
}

const Favorites = ({ user, serverUrl, token }: FavoritesProps) => {
    const { favoriteTracks, loading, error, loadMore, hasMore } = useJellyfinFavoritesData(
        serverUrl,
        user.userId,
        token
    )

    return (
        <div className="favorites-page">
            <MediaList
                items={favoriteTracks}
                type="song"
                loading={loading}
                serverUrl={serverUrl}
                loadMore={loadMore}
                hasMore={hasMore}
            />
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Favorites
