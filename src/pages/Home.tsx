import { Link } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { MediaList } from '../components/MediaList'
import { useJellyfinHomeData } from '../hooks/Jellyfin/useJellyfinHomeData'

export const Home = () => {
    const { recentlyPlayed, frequentlyPlayed, recentlyAdded, isLoading, error } = useJellyfinHomeData()

    if (isLoading) {
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
                <MediaList
                    items={recentlyPlayed}
                    infiniteData={{ pageParams: [1], pages: [recentlyPlayed || []] }}
                    isLoading={isLoading}
                    type="song"
                    title={'Home - Recently Played'}
                />
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
                <MediaList
                    items={frequentlyPlayed}
                    infiniteData={{ pageParams: [1], pages: [frequentlyPlayed || []] }}
                    isLoading={isLoading}
                    type="song"
                    title={'Home - Frequently Played'}
                />
            </div>
            <div className="section">
                <div className="section-header">
                    <div className="container">
                        <div className="section_title">Recently Added</div>
                        <div className="section_desc">Albums recently added to the Library</div>
                    </div>
                </div>
                <MediaList
                    items={recentlyAdded}
                    infiniteData={{ pageParams: [1], pages: [recentlyAdded || []] }}
                    isLoading={isLoading}
                    type="album"
                    title={'Home - Recently Added'}
                />
            </div>
        </div>
    )
}
