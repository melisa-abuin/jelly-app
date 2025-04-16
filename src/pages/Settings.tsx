import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useThemeContext } from '../context/ThemeContext/ThemeContext'
import './Settings.css'

interface SettingsProps {
    onLogout: () => void
}

const Settings = ({ onLogout }: SettingsProps) => {
    const navigate = useNavigate()
    const api = useJellyfinContext()

    const { theme, toggleTheme } = useThemeContext()

    const [lastLogin, setLastLogin] = useState<string | null>(null)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [latency, setLatency] = useState<number | null>(null)
    const { sessionPlayCount, resetSessionCount } = usePlaybackContext()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = await api.fetchUserInfo()
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

                const clientIp = await api.fetchClientIp()
                setClientIp(clientIp)

                const latencyMs = await api.measureLatency()
                setLatency(latencyMs)
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }

        fetchData()
    }, [api])

    const handleLogout = () => {
        resetSessionCount()
        onLogout()
        navigate('/login')
    }

    return (
        <div className="settings-page">
            <div className="section appearance">
                <div className="info">
                    <div className="title">Appearance</div>
                </div>
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
                <div className="info">
                    <div className="title">Audio Quality</div>
                    <div className="desc">
                        1. Some options to enable transcoding, off by default. 2. The audio will be converted to AAC
                        320/128kbps, more container/bitrate options, or rigid/tight selection? 3. Source file (quality)
                        enabled by default, some info about that first or after mentioning transcoding?
                    </div>
                </div>
            </div>
            <div className="section session">
                <div className="info">
                    <div className="title">Session</div>
                    <div className="desc">
                        <p>
                            Currently connected to {api.auth.serverUrl}{' '}
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
                </div>
                <div className="options noSelect">
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings
