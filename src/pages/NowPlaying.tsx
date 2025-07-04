import { ArrowLeftIcon } from '@primer/octicons-react'
import { ChangeEvent, useEffect, WheelEvent } from 'react'
import { Link } from 'react-router-dom'
import { JellyImg } from '../components/JellyImg'
import { Progressbar } from '../components/Main'
import { Squircle } from '../components/Squircle'
import { LyricsIcon, MoreIcon, QueueIcon, TracksIcon } from '../components/SvgIcons'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import './NowPlayingLyrics.css'

export const NowPlaying = () => {
    const { goBack: previousPage } = useHistoryContext()
    const { playlistTitle, currentTrack, bitrate } = usePlaybackContext()

    const playback = usePlaybackContext()
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

    return (
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
                        <div className="desc">{playlistTitle || 'Unknown Playlist'}</div>
                    </div>
                    <div className="tertiary">
                        <div className="more" title="More">
                            <MoreIcon width={14} height={14} />
                        </div>
                    </div>
                </div>
                <div className="playing-content">
                    <div className="playing-artwork noSelect">
                        <Squircle width={360} height={360} cornerRadius={14} isResponsive={true} className="thumbnail">
                            {currentTrack && <JellyImg item={currentTrack} type={'Primary'} width={360} height={360} />}
                            {!currentTrack && (
                                <div className="fallback-thumbnail">
                                    <TracksIcon width="50%" height="50%" />
                                </div>
                            )}
                            <div className="shadow-border" />
                        </Squircle>
                    </div>
                    <div className="playing-info">
                        <div className="song-name">{currentTrack?.Name || 'Unknown Track'}</div>
                        <div className="artist">
                            {currentTrack?.Artists && currentTrack.Artists.length > 0
                                ? currentTrack.Artists.join(', ')
                                : 'Unknown Artist'}
                        </div>
                    </div>
                    <div className="playing-progress noSelect">
                        <div className="info">
                            <div className="duration">0:00</div>
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
                                    {bitrate === 320000
                                        ? '320 kbps'
                                        : bitrate === 256000
                                        ? '256 kbps'
                                        : bitrate === 192000
                                        ? '192 kbps'
                                        : bitrate === 128000
                                        ? '128 kbps'
                                        : '0 kbps'}
                                </div>
                            </div>
                            <div className="duration">2:54</div>
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
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="background-artwork noSelect">
                {currentTrack && <JellyImg item={currentTrack} type={'Primary'} width={360} height={360} />}
            </div>
        </div>
    )
}
