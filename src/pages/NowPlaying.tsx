import { ArrowLeftIcon, HeartFillIcon, HeartIcon } from '@primer/octicons-react'
import { ChangeEvent, useEffect, WheelEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import { Progressbar } from '../components/Main'
import { Squircle } from '../components/Squircle'
import {
    DeletingIcon,
    DownloadedIcon,
    DownloadingIcon,
    LyricsIcon,
    MoreIcon,
    QueueIcon,
    TracksIcon,
} from '../components/SvgIcons'
import { TrackBitrate } from '../components/TrackBitrate'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useScrollContext } from '../context/ScrollContext/ScrollContext'
import { useDuration } from '../hooks/useDuration'
import { useFavorites } from '../hooks/useFavorites'
import './NowPlayingLyrics.css'

export const NowPlaying = () => {
    const { goBack: previousPage } = useHistoryContext()
    const { playlistTitle, playlistUrl, currentTrack, bitrate } = usePlaybackContext()
    const location = useLocation()

    const playback = usePlaybackContext()
    const duration = useDuration()
    const { isOpen, selectedItem, onContextMenu } = useDropdownContext()
    const { addToFavorites, removeFromFavorites } = useFavorites()
    const { setDisabled } = useScrollContext()

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value)
        playback.setVolume(newVolume)
    }

    const handleVolumeScroll = (e: WheelEvent<HTMLInputElement>) => {
        e.stopPropagation()
        const step = e.deltaY > 0 ? -0.02 : 0.02
        const newVolume = Math.max(0, Math.min(1, playback.volume + step))
        playback.setVolume(newVolume)
    }

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    const handleMoreClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!currentTrack) {
            return
        }

        e.stopPropagation()
        onContextMenu(e, { item: currentTrack }, true, { add_to_favorite: true, remove_from_favorite: true })
    }

    return (
        <>
            <div className="now-playing-dimmer noSelect" />
            <div
                className={
                    playback.isPlaying
                        ? 'now-playing playing'
                        : playback.currentTrack
                        ? 'now-playing paused'
                        : 'now-playing'
                }
            >
                <div className="ui">
                    <div className="playing-header">
                        <div className="primary">
                            <div onClick={previousPage} className="return_icon" title="Back">
                                <ArrowLeftIcon size={16}></ArrowLeftIcon>
                            </div>
                        </div>
                        <div className="secondary">
                            <div className="title">Playing From</div>
                            <div className="desc" title={playlistTitle || 'No Playlist'}>
                                {playlistUrl ? (
                                    <Link to={playlistUrl} className="textlink">
                                        {playlistTitle}
                                    </Link>
                                ) : (
                                    <>{playlistTitle || 'No Playlist'}</>
                                )}
                            </div>
                        </div>
                        <div className="tertiary">
                            <div
                                className="favorite-state"
                                title={
                                    currentTrack?.UserData?.IsFavorite ? 'Remove from favorites' : 'Add to favorites'
                                }
                                onClick={async () => {
                                    if (currentTrack?.Id) {
                                        try {
                                            if (currentTrack?.UserData?.IsFavorite) {
                                                await removeFromFavorites(currentTrack)
                                            } else {
                                                await addToFavorites(currentTrack)
                                            }
                                        } catch (error) {
                                            console.error('Failed to update favorite status:', error)
                                        }
                                    }
                                }}
                            >
                                {currentTrack?.UserData?.IsFavorite ? (
                                    <HeartFillIcon size={16} />
                                ) : (
                                    <HeartIcon size={16} />
                                )}
                            </div>
                            <div
                                className={`more ${isOpen && selectedItem?.Id === currentTrack?.Id ? 'active' : ''}`}
                                onClick={handleMoreClick}
                                title="More"
                            >
                                <MoreIcon width={14} height={14} />
                            </div>
                        </div>
                    </div>
                    <div className="playing-content">
                        <div className="playing-artwork noSelect">
                            <Squircle
                                width={360}
                                height={360}
                                cornerRadius={14}
                                isResponsive={true}
                                className="thumbnail"
                            >
                                {currentTrack && (
                                    <JellyImg item={currentTrack} type={'Primary'} width={360} height={360} />
                                )}
                                {!currentTrack && (
                                    <div className="fallback-thumbnail">
                                        <TracksIcon width="50%" height="50%" />
                                    </div>
                                )}
                                <div className="shadow-border" />
                            </Squircle>
                        </div>
                        <div className="playing-info">
                            <div className="song-name" title={currentTrack?.Name || 'No Track Played'}>
                                {currentTrack?.Name || 'No Track Played'}
                            </div>
                            <div
                                className="artist"
                                title={
                                    currentTrack?.Artists && currentTrack.Artists.length > 0
                                        ? currentTrack.Artists.join(', ')
                                        : 'No Artist'
                                }
                            >
                                {currentTrack?.Artists && currentTrack.Artists.length > 0
                                    ? currentTrack.Artists.join(', ')
                                    : 'No Artist'}
                            </div>
                        </div>
                        <div className="playing-progress noSelect">
                            <div className="info">
                                <div className="duration">{playback.formatTime(duration.progress)}</div>
                                <div className="quality">
                                    <div className="text">
                                        {bitrate === 320000
                                            ? 'High'
                                            : bitrate === 256000
                                            ? 'Medium'
                                            : bitrate === 192000
                                            ? 'Low'
                                            : bitrate === 128000
                                            ? 'Minimal'
                                            : 'Source'}
                                    </div>
                                    <div className="divider" />
                                    <div className="bitrate">
                                        <span className="number">
                                            {bitrate === 320000 ? (
                                                '320'
                                            ) : bitrate === 256000 ? (
                                                '256'
                                            ) : bitrate === 192000 ? (
                                                '192'
                                            ) : bitrate === 128000 ? (
                                                '128'
                                            ) : (
                                                <TrackBitrate currentTrack={currentTrack} />
                                            )}
                                        </span>{' '}
                                        kbps
                                    </div>
                                    {currentTrack?.offlineState && (
                                        <div className="download-state">
                                            {currentTrack?.offlineState === 'downloading' && (
                                                <div className="icon downloading" title="Syncing...">
                                                    <DownloadingIcon width={12} height={12} />
                                                </div>
                                            )}

                                            {currentTrack?.offlineState === 'downloaded' && (
                                                <div className="icon downloaded" title="Synced">
                                                    <DownloadedIcon width={12} height={12} />
                                                </div>
                                            )}

                                            {currentTrack?.offlineState === 'deleting' && (
                                                <div className="icon deleting" title="Unsyncing...">
                                                    <DeletingIcon width={12} height={12} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="duration">{playback.formatTime(duration.duration)}</div>
                            </div>
                            <Progressbar />
                        </div>
                        <div className="playing-controls">
                            <div
                                className={`shuffle ${playback.shuffle ? 'active' : ''}`}
                                onClick={playback.toggleShuffle}
                                title="Shuffle"
                            >
                                <div className="shuffle-icon"></div>
                            </div>
                            <div className="primary">
                                <div className="previous" onClick={playback.previousTrack} title="Previous">
                                    <div className="previous-icon"></div>
                                </div>
                                <div className="container">
                                    <div className="play" onClick={playback.togglePlayPause} title="Play">
                                        <div className="play-icon"></div>
                                    </div>
                                    <div className="pause" onClick={playback.togglePlayPause} title="Pause">
                                        <div className="pause-icon"></div>
                                    </div>
                                </div>
                                <div className="next" onClick={playback.nextTrack} title="Next">
                                    <div className="next-icon"></div>
                                </div>
                            </div>
                            <div
                                className={`repeat ${playback.repeat === 'off' ? '' : 'active'}`}
                                onClick={playback.toggleRepeat}
                                title="Repeat"
                            >
                                <div className={`repeat-icon${playback.repeat === 'one' ? '-one' : ''}`}></div>
                            </div>
                        </div>
                    </div>
                    <div className="playing-footer">
                        <div className="actions">
                            <Link to="/nowplaying/lyrics" className="action" title="Lyrics">
                                <LyricsIcon width={20} height={20} />
                            </Link>
                            <Link to="/queue" className="action" title="Queue">
                                <QueueIcon width={20} height={20} />
                            </Link>
                        </div>
                        <div className="playing-volume">
                            <div className="indicator">Volume: {(playback.volume * 100).toFixed(0)}%</div>
                            <div className="control">
                                <input
                                    type="range"
                                    id="volume"
                                    name="volume"
                                    min="0"
                                    max="1"
                                    step="0.02"
                                    value={playback.volume}
                                    onChange={handleVolumeChange}
                                    onWheel={handleVolumeScroll}
                                    onMouseEnter={() => setDisabled(true)}
                                    onMouseLeave={() => setDisabled(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="background-artwork noSelect">
                    {currentTrack && <JellyImg item={currentTrack} type={'Primary'} width={360} height={360} />}
                </div>
            </div>
        </>
    )
}
