import axios from 'axios' // Add for better error typing
import { FormEvent, useEffect, useState } from 'react'
import { loginToJellyfin } from '../api/jellyfin'

interface AuthFormProps {
    onLogin: (authData: { serverUrl: string; token: string; userId: string; username: string }) => void
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
    const [serverUrl, setServerUrl] = useState<string>('')
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    // Load the last used serverUrl from localStorage on mount
    useEffect(() => {
        const savedServerUrl = localStorage.getItem('lastServerUrl')
        if (savedServerUrl) {
            setServerUrl(savedServerUrl)
        }
    }, [])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Pre-validate serverUrl
        if (!serverUrl.trim()) {
            setError('Please enter a server URL.')
            setLoading(false)
            return
        }

        // Basic URL format check
        const urlPattern = /^https?:\/\/.+/
        if (!urlPattern.test(serverUrl)) {
            setError('Invalid URL format. Use http:// or https:// followed by a valid address.')
            setLoading(false)
            return
        }

        try {
            const { token, userId, username: fetchedUsername } = await loginToJellyfin(serverUrl, username, password)
            // Save the serverUrl to localStorage on successful login
            localStorage.setItem('lastServerUrl', serverUrl)
            onLogin({ serverUrl, token, userId, username: fetchedUsername })
        } catch (err) {
            if (axios.isAxiosError(err)) {
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
                } else if (err.request) {
                    // Network errors (no response received)
                    setError('Cannot reach the server. Check your network or URL.')
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
            <button className="submit_button" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login with Jellyfin'}
            </button>
        </form>
    )
}

export default AuthForm
