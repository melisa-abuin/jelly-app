import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import QueueTrackList from '../components/QueueTrackList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinQueueData } from '../hooks/useJellyfinQueueData'
import './Queue.css'

const Queue = () => {
    const { setPageTitle } = usePageTitle()
    const playback = usePlaybackContext()
    const jellyfin = useJellyfinContext()
    const { tracks, loading, loadMore, hasMore } = useJellyfinQueueData()

    const { data: playlist } = useQuery({
        queryKey: ['playlist', playback.currentTrack?.ParentId],
        queryFn: () => jellyfin.getPlaylist(playback.currentTrack!.ParentId!),
        enabled: !!playback.currentTrack?.ParentId,
    })

    useEffect(() => {
        setPageTitle('Queue')
        return () => {
            setPageTitle('')
        }
    }, [setPageTitle])

    if (playback.currentPlaylist.length === 0 && !playback.currentTrack) {
        return <div className="empty">Queue is empty</div>
    }

    return (
        <div className="queue-page">
            <div className="queue-header">
                {playback.currentTrack && (
                    <QueueTrackList
                        tracks={[playback.currentTrack]}
                        loading={false}
                        playTrack={(index: number) => {
                            playback.setCurrentPlaylist([playback.currentTrack], false, undefined)
                            playback.playTrack(index)
                        }}
                        playlist={[playback.currentTrack]}
                        showType="artist"
                        showTrackNumber={false}
                        disablePagination
                    />
                )}
            </div>

            <div className="queue-title">Playing Next</div>
            <div className="queue-desc">
                {playback.currentTrack?.ParentId && playlist ? (
                    <>
                        <span className="text">From </span>
                        <Link to={`/playlist/${playback.currentTrack.ParentId}`}>{playlist.Name}</Link>
                    </>
                ) : playback.currentTrack?.Album ? (
                    <>
                        <span className="text">From </span>
                        <Link to={`/album/${playback.currentTrack.AlbumId}`}>{playback.currentTrack.Album}</Link>
                    </>
                ) : (
                    <span className="someclass">from Tracks</span>
                )}
            </div>

            <QueueTrackList
                tracks={tracks}
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={(index: number) => {
                    // Adjust index to account for currentTrack exclusion
                    playback.setCurrentPlaylist(tracks, hasMore, loadMore)
                    playback.playTrack(index + 1)
                }}
                playlist={tracks}
                showType="artist"
                showTrackNumber={false}
            />
        </div>
    )
}

export default Queue
