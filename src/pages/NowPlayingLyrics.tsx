import { ArrowLeftIcon } from '@primer/octicons-react'
import { useEffect } from 'react'
import { JellyImg } from '../components/JellyImg'
import { Progressbar } from '../components/Main'
import { Squircle } from '../components/Squircle'
import { MoreIcon, TracksIcon } from '../components/SvgIcons'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { Lyrics } from './Lyrics'
import './NowPlaying.css'

export const NowPlayingLyrics = () => {
    const { goBack: previousPage } = useHistoryContext()
    const { currentTrack, bitrate } = usePlaybackContext()

    const playback = usePlaybackContext()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    return (
        <div
            className={
                playback.isPlaying
                    ? 'now-playing-lyrics playing'
                    : playback.currentTrack
                    ? 'now-playing-lyrics paused'
                    : 'now-playing-lyrics'
            }
        >
            <div className="ui">
                <div className="playing-header main_header">
                    <div className="wrapper">
                        <div className="inner">
                            <div className="primary">
                                <div onClick={previousPage} className="return_icon" title="Back">
                                    <ArrowLeftIcon size={16}></ArrowLeftIcon>
                                </div>
                                <Squircle width={40} height={40} cornerRadius={6} className="thumbnail">
                                    {currentTrack && (
                                        <JellyImg item={currentTrack} type={'Primary'} width={40} height={40} />
                                    )}
                                    {!currentTrack && (
                                        <div className="fallback-thumbnail">
                                            <TracksIcon width="50%" height="50%" />
                                        </div>
                                    )}
                                </Squircle>
                            </div>
                            <div className="secondary">
                                <div className="artist">
                                    {currentTrack?.Artists && currentTrack.Artists.length > 0
                                        ? currentTrack.Artists.join(', ')
                                        : 'Unknown Artist'}
                                </div>
                                <div className="song-name">{currentTrack?.Name || 'Unknown Track'}</div>
                            </div>
                            <div className="tertiary">
                                <div className="more" title="More">
                                    <MoreIcon width={14} height={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="playing-content">
                    <Lyrics />
                </div>

                <div className="playing-footer main_footer">
                    <div className="wrapper">
                        <div className="inner">
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
                    </div>
                </div>
            </div>

            <div className="background-artwork noSelect">
                {currentTrack && <JellyImg item={currentTrack} type={'Primary'} width={360} height={360} />}
            </div>
        </div>
    )
}
