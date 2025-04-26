import MediaList from '../components/MediaList'
import { useJellyfinFrequentlyPlayedData } from '../hooks/useJellyfinFrequentlyPlayedData'

const FrequentlyPlayed = () => {
    const { items, error } = useJellyfinFrequentlyPlayedData()

    return (
        <div className="frequently-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} type="song" />
        </div>
    )
}

export default FrequentlyPlayed
