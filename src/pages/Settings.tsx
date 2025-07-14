import { CheckCircleFillIcon } from '@primer/octicons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAudioStorageContext } from '../context/AudioStorageContext/AudioStorageContext'
import { useDownloadContext } from '../context/DownloadContext/DownloadContext'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useThemeContext } from '../context/ThemeContext/ThemeContext'
import { persister } from '../queryClient'
import { formatFileSize } from '../utils/formatFileSize'
import './Settings.css'

export const Settings = ({ onLogout }: { onLogout: () => void }) => {
    const navigate = useNavigate()
    const api = useJellyfinContext()
    const audioStorage = useAudioStorageContext()

    const { theme, toggleTheme } = useThemeContext()

    const [lastLogin, setLastLogin] = useState<string | null>(null)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [latency, setLatency] = useState<number | null>(null)
    const { sessionPlayCount, resetSessionCount, bitrate, setBitrate } = usePlaybackContext()
    const playback = usePlaybackContext()
    const queryClient = useQueryClient()
    const { storageStats, refreshStorageStats, queueCount, clearQueue } = useDownloadContext()

    const [clearing, setClearing] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, clientIp, latencyMs] = await Promise.all([
                    api.fetchUserInfo(),
                    api.fetchClientIp(),
                    api.measureLatency(),
                ])

                if (user.LastLoginDate) {
                    const date = new Date(user.LastLoginDate)
                    const formatted = date
                        .toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            year: 'numeric',
                            hour12: true,
                        })
                        .replace(/,/, '')
                    setLastLogin(formatted)
                } else {
                    setLastLogin(null)
                }

                setClientIp(clientIp)
                setLatency(latencyMs)
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }

        fetchData()
    }, [api])

    const handleLogout = () => {
        playback.audioRef.current.pause()
        playback.crossfadeRef.current.pause()
        resetSessionCount()
        onLogout()
        navigate('/login')
    }

    const handleClearAll = useCallback(async () => {
        if (!confirm('Are you sure you want to clear all downloads? This cannot be undone.')) {
            return
        }

        try {
            setClearing(true)
            await audioStorage.clearAllDownloads()
            queryClient.clear()
            await persister.removeClient()
            clearQueue()
            await refreshStorageStats()
        } catch (error) {
            console.error('Failed to clear downloads:', error)
        } finally {
            setClearing(false)
        }
    }, [audioStorage, clearQueue, queryClient, refreshStorageStats])

    return (
        <div className="settings-page">
            <div className="section appearance">
                <div className="title">Appearance</div>
                <div className="options noSelect">
                    <div
                        className={`option light ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => toggleTheme('light')}
                    >
                        <div className="visual" />
                        <div className="desc">Light</div>
                    </div>
                    <div
                        className={`option dark ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => toggleTheme('dark')}
                    >
                        <div className="visual" />
                        <div className="desc">Dark</div>
                    </div>
                    <div
                        className={`option system ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => toggleTheme('system')}
                    >
                        <div className="visual" />
                        <div className="desc">System</div>
                    </div>
                </div>
            </div>
            <div className="section quality">
                <div className="title">Audio Quality</div>
                <div className="container">
                    <div className="info">
                        <div className="subtitle">Streaming & Offline Sync</div>
                        <div className="subdesc">
                            Adjusting audio quality enables server-side transcoding, converting to a compatible format
                            with a lower bitrate for smoother streaming or efficient offline syncing
                        </div>
                    </div>
                    <div className="options noSelect">
                        <div className={'option source' + (!bitrate ? ' active' : '')} onClick={() => setBitrate(0)}>
                            <div className="status">
                                <CheckCircleFillIcon size={16} />
                            </div>
                            <div className="details">
                                <div className="title">Source</div>
                                <div className="desc">
                                    Direct playback of the original audio source without modifications
                                </div>
                            </div>
                        </div>
                        <div
                            className={'option high' + (bitrate === 320000 ? ' active' : '')}
                            onClick={() => setBitrate(320000)}
                        >
                            <div className="status">
                                <CheckCircleFillIcon size={16} />
                            </div>
                            <div className="details">
                                <div className="title">
                                    High <span className="bitrate">320 kbps</span>
                                </div>
                                <div className="desc">
                                    Superior sound quality, perfect for immersive listening with moderate data usage
                                </div>
                            </div>
                        </div>
                        <div
                            className={'option medium' + (bitrate === 256000 ? ' active' : '')}
                            onClick={() => setBitrate(256000)}
                        >
                            <div className="status">
                                <CheckCircleFillIcon size={16} />
                            </div>
                            <div className="details">
                                <div className="title">
                                    Medium <span className="bitrate">256 kbps</span>
                                </div>
                                <div className="desc">
                                    Crisp audio with a balanced blend of quality and data efficiency
                                </div>
                            </div>
                        </div>
                        <div
                            className={'option low' + (bitrate === 192000 ? ' active' : '')}
                            onClick={() => setBitrate(192000)}
                        >
                            <div className="status">
                                <CheckCircleFillIcon size={16} />
                            </div>
                            <div className="details">
                                <div className="title">
                                    Low <span className="bitrate">192 kbps</span>
                                </div>
                                <div className="desc">Solid quality tailored for streaming with reduced bandwidth</div>
                            </div>
                        </div>
                        <div
                            className={'option minimal' + (bitrate === 128000 ? ' active' : '')}
                            onClick={() => setBitrate(128000)}
                        >
                            <div className="status">
                                <CheckCircleFillIcon size={16} />
                            </div>
                            <div className="details">
                                <div className="title">
                                    Minimal <span className="bitrate">128 kbps</span>
                                </div>
                                <div className="desc">
                                    Essential audio quality optimized for the lowest data consumption
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="section offline-sync">
                <div className="primary">
                    <div className="container">
                        <div className="title">Offline Sync</div>
                        <div className="desc">
                            Synced Music - <span className="number">{storageStats.trackCount}</span> Track
                            {storageStats.trackCount === 1 ? '' : 's'}
                            {queueCount > 0 ? (
                                <>
                                    {' '}
                                    (<span className="number">{queueCount}</span> track{queueCount === 1 ? '' : 's'} in
                                    queue)
                                </>
                            ) : (
                                ''
                            )}{' '}
                            /{' '}
                            <span className="number">
                                {formatFileSize(storageStats.trackCount === 0 ? 0 : storageStats?.indexedDB || 0)}
                            </span>{' '}
                            Used
                        </div>
                    </div>
                    <div className="options noSelect">
                        <div className="option">
                            {(storageStats.trackCount > 0 || queueCount > 0 || !audioStorage.isInitialized()) && (
                                <button className="btn clear" onClick={handleClearAll} disabled={clearing}>
                                    {clearing ? 'Clearing...' : 'Clear All'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="desc">
                    <div className="info">
                        Cache your music library for seamless offline playback, with new tracks auto-syncing to saved
                        playlists, albums, or artists.{' '}
                        <Link to="/synced" className="textlink">
                            Browse music library
                        </Link>
                        , available once tracks are synced
                    </div>
                </div>
            </div>
            <div className={'section crossfade' + (playback.isCrossfadeActive ? '' : ' disabled')}>
                <div className="primary">
                    <div className="container">
                        <div className="title">Crossfade</div>
                    </div>
                    <div className="options noSelect">
                        <div className="option adjustable">
                            <div className="number current">{playback.crossfadeDuration}s</div>
                            <div className="slider">
                                <input
                                    type="range"
                                    id="crossfade"
                                    name="crossfade"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value={playback.crossfadeDuration}
                                    onChange={e => playback.setCrossfadeDuration(Number(e.target.value))}
                                />
                            </div>
                            <div className="number">12s</div>
                        </div>
                        <div className="option">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={playback.isCrossfadeActive}
                                    onChange={e => playback.setIsCrossfadeActive(e.target.checked)}
                                ></input>
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="desc">
                    <div className="info">
                        Smoothly transition between tracks by gradually fading out the current song while simultaneously
                        fading in the next, creating a seamless and immersive listening experience
                    </div>
                </div>
            </div>
            <div className="section lyrics">
                <div className="title">Lyrics</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Timestamps</div>
                            <div className="subdesc">Show timestamps with the synchronized lyrics</div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={playback.lyricsTimestamps}
                                onChange={e => playback.setLyricsTimestamps(e.target.checked)}
                            ></input>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Alignment</div>
                            <div className="subdesc">
                                Center lyrics for a different look, overriding the default left alignment
                            </div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={playback.centeredLyrics}
                                onChange={e => playback.setCenteredLyrics(e.target.checked)}
                            ></input>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="section ui-settings">
                <div className="title">Interface</div>
                <div className="inner row">
                    <div className="container">
                        <div className="desc">
                            <div className="subtitle">Filter state</div>
                            <div className="subdesc">
                                Remember selected filters across sessions for a consistent experience
                            </div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={playback.rememberFilters}
                                onChange={e => playback.setRememberFilters(e.target.checked)}
                            ></input>
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div className="section about">
                <div className="title">About</div>
                <div className="desc">
                    <p className="subtitle">Jelly Music App - Version {__VERSION__}</p>
                    <p>An open source music player for Jellyfin</p>
                    <p>
                        Carefully crafted with great attention to detail, aiming to reduce noise and distractions with a
                        minimalistic & lightweight interface:
                        <span className="mantra"> "the quieter you become, the more you are able to hear"</span>
                    </p>
                    <p className="subfooter">
                        <span>Source code is freely available on </span>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="textlink"
                            href="https://github.com/Stannnnn/jelly-app"
                        >
                            GitHub
                        </a>
                        <span> and is licensed under the MIT license</span>
                    </p>
                </div>
            </div>
            <div className="section session">
                <div className="title">Session</div>
                <div className="desc">
                    <p>
                        Currently connected to{' '}
                        <a target="_blank" rel="noopener noreferrer" className="textlink" href={api.auth.serverUrl}>
                            {api.auth.serverUrl}
                        </a>{' '}
                        {latency !== null && (
                            <span>
                                <span>with {latency}ms latency</span>
                            </span>
                        )}
                    </p>
                    <p>
                        Last login: {lastLogin} {clientIp ? ` from ${clientIp}` : ''}
                    </p>
                    <p>
                        Played{' '}
                        {sessionPlayCount !== null && (
                            <span>
                                {sessionPlayCount} {sessionPlayCount === 1 ? 'track' : 'tracks'}
                            </span>
                        )}{' '}
                        since login
                    </p>
                </div>
                <div className="actions noSelect">
                    <button onClick={handleLogout} className="btn logout">
                        Logout
                    </button>

                    <button
                        onClick={async () => {
                            queryClient.clear()
                            await persister.removeClient()
                            window.location.reload()
                        }}
                        className="btn reload"
                        title="Reloading can help with issues like outdated cache or version conflicts."
                    >
                        Reload App
                    </button>
                </div>
            </div>
        </div>
    )
}
