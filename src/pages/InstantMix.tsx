import { useParams } from 'react-router-dom'
import { MediaList } from '../components/MediaList'
import { useJellyfinInstantMixData } from '../hooks/Jellyfin/useJellyfinInstantMixData'

export const InstantMix = () => {
    const { songId } = useParams<{ songId: string }>()
    const { items, loading, error } = useJellyfinInstantMixData({ songId })

    return (
        <div className="tracks-page">
            {error && <div className="error">{error}</div>}
            <MediaList items={items} isLoading={loading} type="song" title={'Instant Mix'} />
        </div>
    )
}
