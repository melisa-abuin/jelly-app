import { FormEvent, useEffect, useState } from 'react'
import { ApiError, loginToJellyfin } from '../api/jellyfin'
import { useExternalConfig } from '../hooks/useExternalConfig'
import { Loader } from './Loader'

export const AuthForm = ({
    onLogin,
}: {
    onLogin: (authData: { serverUrl: string; token: string; userId: string; username: string }) => void
}) => {
    const queryParams = new URLSearchParams(window.location.search)
    const isDemo = queryParams.get('demo') === '1'

    // If the URL is locked, we just use the default
    const loadedURL = isDemo ? 'https://demo.jellyfin.org/stable' : localStorage.getItem('lastServerUrl') || ''
    const [serverUrl, setServerUrl] = useState(loadedURL)

    const { data: config, isPending: loadingConfiguration } = useExternalConfig()
    const [username, setUsername] = useState(isDemo ? 'demo' : '')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!config) return

        if (config.lockJellyfinUrl) setServerUrl(config.defaultJellyfinUrl || '')
        else if (!serverUrl) setServerUrl(config.defaultJellyfinUrl || '')
    }, [serverUrl, loadingConfiguration, config])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Pre-validate serverUrl
        if (!serverUrl) {
            setError('Please enter a server URL.')
            setLoading(false)
            return
        }

        let trimmedServerUrl = serverUrl.toLowerCase().replace(new RegExp('/+$'), '')

        // Basic URL format check
        const urlPattern = /^https?:\/\/.+/
        if (!urlPattern.test(trimmedServerUrl)) {
            setError('Invalid URL format. Use http:// or https:// followed by a valid address.')
            setLoading(false)
            return
        }

        try {
            let result

            try {
                result = await loginToJellyfin(trimmedServerUrl, username, password)
            } catch (firstErr) {
                const formattedServerUrl = trimmedServerUrl.split('/').slice(0, 3).join('/')

                if (trimmedServerUrl !== formattedServerUrl) {
                    trimmedServerUrl = formattedServerUrl
                    result = await loginToJellyfin(trimmedServerUrl, username, password)
                } else {
                    throw firstErr
                }
            }

            const { token, userId, username: fetchedUsername } = result!

            // Save the serverUrl to localStorage on successful login
            localStorage.setItem('lastServerUrl', trimmedServerUrl)
            onLogin({ serverUrl: trimmedServerUrl, token, userId, username: fetchedUsername })
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.response) {
                    // HTTP status errors
                    if (err.response.status === 401) {
                        setError('Invalid credentials entered.')
                    } else if (err.response.status === 404) {
                        setError('Server not found. Please check the URL.')
                    } else if (err.response.status === 400) {
                        setError('Invalid request. Please check your input.')
                    } else {
                        setError(`Login failed: Server returned status ${err.response.status}.`)
                    }
                } else {
                    // Setup errors (e.g., bad config)
                    setError('Login failed: Request setup error.')
                }
            } else {
                setError('An unexpected error occurred. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return loadingConfiguration ? (
        <Loader></Loader>
    ) : (
        <form className="login_form" onSubmit={handleSubmit}>
            <div className="error_placeholder">{error && <div className="error">{error}</div>}</div>
            <div className="title">Welcome back</div>
            {!config?.lockJellyfinUrl && ( // We do not render if the URL is locked
                <div className="input_container">
                    <input
                        type="text"
                        placeholder="Server URL (http://localhost:8096)"
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)}
                        disabled={loading}
                    />
                </div>
            )}
            <div className="input_container">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                />
            </div>
            <div className="input_container">
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                />
            </div>
            <button className="submit_button noSelect" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login with Jellyfin'}
            </button>
        </form>
    )
}
