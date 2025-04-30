import { Link } from 'react-router-dom' // Add this import
import Loader from '../components/Loader'
import MediaList from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/Jellyfin/useJellyfinHomeData'

const Home = () => {
    const { recentlyPlayed, frequentlyPlayed, recentlyAdded, loading, error } = useJellyfinHomeData()

    if (loading) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="home-page">
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Recently Played</div>
                        <div className="section_desc">Songs you queued up lately</div>
                    </div>
                    <Link to="/recently" className="see-more noSelect">
                        See more
                    </Link>
                </div>
                <MediaList items={recentlyPlayed} type="song" />
            </div>
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Frequently Played</div>
                        <div className="section_desc">Songs you listen to often</div>
                    </div>
                    <Link to="/frequently" className="see-more noSelect">
                        See more
                    </Link>
                </div>
                <MediaList items={frequentlyPlayed} type="song" />
            </div>
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Recently Added</div>
                        <div className="section_desc">Albums recently added to the Library</div>
                    </div>
                </div>
                <MediaList items={recentlyAdded} type="album" />
            </div>
        </div>
    )
}

export default Home
