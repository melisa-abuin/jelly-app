import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import { Loader } from '../components/Loader'
import { PlaylistTrackList } from '../components/PlaylistTrackList'
import { Squircle } from '../components/Squircle'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinInstantMixData } from '../hooks/Jellyfin/useJellyfinInstantMixData'
import { useJellyfinMediaItem } from '../hooks/Jellyfin/useJellyfinMediaItem'
import { formatDurationReadable } from '../utils/formatDurationReadable'
import './InstantMix.css'

export const InstantMix = () => {
    const { songId } = useParams<{ songId: string }>()
    const { items, loading, error } = useJellyfinInstantMixData({ songId })
    const { mediaItem: sourceSong } = useJellyfinMediaItem(songId)
    const playback = usePlaybackContext()
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (sourceSong) {
            setPageTitle(`Instant Mix - ${sourceSong.Name}`)
        }
        return () => {
            setPageTitle('')
        }
    }, [sourceSong, setPageTitle])

    if (loading && items.length === 0) {
        return <Loader />
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    const totalPlaytime = items.reduce((total, item) => total + (item.RunTimeTicks || 0), 0)

    return (
        <div className="instant-mix-page">
            <div className="instant-mix-header">
                {sourceSong && (
                    <Squircle width={100} height={100} cornerRadius={8} className="thumbnail">
                        <JellyImg item={sourceSong} type={'Primary'} width={100} height={100} />
                    </Squircle>
                )}

                <div className="instant-mix-details">
                    <div className="title">Instant Mix</div>
                    <div className="subtitle">
                        Based on <span className="highlight">{sourceSong?.Name || 'Unknown Song'}</span>
                    </div>
                    <div className="stats">
                        <div className="track-amount">
                            <span className="number">{items.length}</span>{' '}
                            <span>{items.length === 1 ? 'Track' : 'Tracks'}</span>
                        </div>
                        <div className="divider"></div>
                        <div className="length">
                            <span className="number">{formatDurationReadable(totalPlaytime)}</span> <span>Total</span>
                        </div>
                    </div>
                    <div className="actions noSelect">
                        <div className="primary">
                            <div
                                className="play-instant-mix"
                                onClick={() => {
                                    playback.setCurrentPlaylistSimple({ playlist: items, title: 'Instant Mix' })
                                    playback.playTrack(0)
                                }}
                            >
                                <div className="play-icon" />
                                <div className="text">Play</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PlaylistTrackList
                tracks={items}
                infiniteData={{ pageParams: [1], pages: [items] }}
                isLoading={loading}
                title={sourceSong ? `Instant Mix - ${sourceSong.Name}` : 'Instant Mix'}
                disableUrl={true}
            />
        </div>
    )
}
