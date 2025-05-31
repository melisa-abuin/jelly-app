import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MediaItem } from '../api/jellyfin'
import { Loader } from '../components/Loader'
import { TrackList } from '../components/TrackList'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { formatFileSize } from '../utils/formatFileSize'

export const Downloads = () => {
    const api = useJellyfinContext()
    const audioStorage = useAudioStorageContext()

    const [downloadedTracks, setDownloadedTracks] = useState<MediaItem[]>([])
    const [trackCount, setTrackCount] = useState(0)
    const [storageStats, setStorageStats] = useState<{ usage: number; indexedDB: number }>({ usage: 0, indexedDB: 0 })
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadDownloads = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Get storage statistics
            setTrackCount(await audioStorage.getTrackCount())

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const storageStats: any = await navigator.storage.estimate()
            setStorageStats({ usage: storageStats?.usage || 0, indexedDB: storageStats?.usageDetails?.indexedDB || 0 })

            // Get all downloaded tracks
            const allTracks = await audioStorage.getAllTracks()
            const songIds = allTracks
                .filter(track => track.data.type === 'song' || track.data.type === 'm3u8')
                .map(track => track.id)

            if (songIds.length === 0) {
                setDownloadedTracks([])
                return
            }

            // Fetch track metadata from Jellyfin
            const trackPromises = songIds.map(async id => {
                try {
                    return await api.fetchMediaItem(id)
                } catch (error) {
                    console.warn(`Failed to fetch metadata for track ${id}:`, error)
                    return null
                }
            })

            const tracks = (await Promise.all(trackPromises))
                .filter((track): track is MediaItem => track !== null)
                .map(track => ({ ...track, offlineState: 'downloaded' as const }))

            setDownloadedTracks(tracks)
        } catch (error) {
            console.error('Failed to load downloads:', error)
            setError('Failed to load downloads. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [api, audioStorage])

    const handleClearAll = useCallback(async () => {
        if (!confirm('Are you sure you want to clear all downloads? This cannot be undone.')) {
            return
        }

        try {
            setClearing(true)
            await audioStorage.clearAllDownloads()
            setDownloadedTracks([])
        } catch (error) {
            console.error('Failed to clear downloads:', error)
            setError('Failed to clear downloads. Please try again.')
        } finally {
            setClearing(false)
        }
    }, [audioStorage])

    useEffect(() => {
        loadDownloads()
    }, [loadDownloads])

    if (loading) {
        return <Loader />
    }

    return (
        <div className="downloads-page">
            <div className="downloads-content">
                <div className="downloads-header">
                    <div className="header-info">
                        <div className="title">Downloaded Music</div>
                        <div className="desc">
                            Manage your offline music collection - {trackCount} Tracks /{' '}
                            {formatFileSize(storageStats?.indexedDB || 0)}
                        </div>
                    </div>
                    {downloadedTracks.length > 0 && (
                        <button className="clear-all-button" onClick={handleClearAll} disabled={clearing}>
                            {clearing ? 'Clearing...' : 'Clear All'}
                        </button>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {downloadedTracks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📱</div>
                        <h3>No Downloads Yet</h3>
                        <p>
                            Download music to enjoy it offline. Look for the download button on tracks, albums, and
                            playlists.
                        </p>
                        <Link to="/" className="browse-link">
                            Browse Music
                        </Link>
                    </div>
                ) : (
                    <div className="tracks-container">
                        <TrackList tracks={downloadedTracks} title="Downloads" />
                    </div>
                )}
            </div>
        </div>
    )
}
