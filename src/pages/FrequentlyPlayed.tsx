import MediaList from '../components/MediaList'
import { useJellyfinFrequentlyPlayedData } from '../hooks/Jellyfin/useJellyfinFrequentlyPlayedData'

const FrequentlyPlayed = () => {
    const { items, error } = useJellyfinFrequentlyPlayedData()

    return (
        <div className="frequently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" queryKey="frequentlyPlayed" />
        </div>
    )
}

export default FrequentlyPlayed
