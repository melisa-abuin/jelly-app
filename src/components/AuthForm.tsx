import { FormEvent, useState } from 'react'
import { ApiError, loginToJellyfin } from '../api/jellyfin'

export const AuthForm = ({
    onLogin,
}: {
    onLogin: (authData: { serverUrl: string; token: string; userId: string; username: string }) => void
}) => {
    const [serverUrl, setServerUrl] = useState(localStorage.getItem('lastServerUrl') || '')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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

        const formattedServerUrl = serverUrl.split('/').slice(0, 3).join('/')

        // Basic URL format check
        const urlPattern = /^https?:\/\/.+/
        if (!urlPattern.test(formattedServerUrl)) {
            setError('Invalid URL format. Use http:// or https:// followed by a valid address.')
            setLoading(false)
            return
        }

        try {
            const {
                token,
                userId,
                username: fetchedUsername,
            } = await loginToJellyfin(formattedServerUrl, username, password)
            // Save the serverUrl to localStorage on successful login
            localStorage.setItem('lastServerUrl', formattedServerUrl)
            onLogin({ serverUrl: formattedServerUrl, token, userId, username: fetchedUsername })
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

    return (
        <form className="login_form" onSubmit={handleSubmit}>
            <div className="error_placeholder">{error && <div className="error">{error}</div>}</div>
            <div className="title">Welcome back</div>
            <div className="input_container">
                <input
                    type="text"
                    placeholder="Server URL (http://localhost:8096)"
                    value={serverUrl}
                    onChange={e => setServerUrl(e.target.value)}
                    disabled={loading}
                />
            </div>
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
