import MediaList from '../components/MediaList'
import { useJellyfinFrequentlyPlayedData } from '../hooks/Jellyfin/useJellyfinFrequentlyPlayedData'

const FrequentlyPlayed = () => {
    const { items, isLoading, error } = useJellyfinFrequentlyPlayedData()

    return (
        <div className="frequently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} isLoading={isLoading} type="song" />
        </div>
    )
}

export default FrequentlyPlayed
