import { MediaItem } from '../api/jellyfin'
import { useJellyfinTrackInfo } from '../hooks/Jellyfin/useJellyfinTrackInfo'

export const TrackBitrate = ({ currentTrack }: { currentTrack: MediaItem | undefined }) => {
    const mediaSourceBitRate = currentTrack?.MediaSources?.[0].Bitrate
    const trackInfo = useJellyfinTrackInfo(typeof mediaSourceBitRate === 'number' ? '' : currentTrack?.Id || '')
    const bitrate = Math.round((mediaSourceBitRate || trackInfo.MediaSources?.[0].Bitrate || 0) / 1000)

    return <>{bitrate}</>
}
