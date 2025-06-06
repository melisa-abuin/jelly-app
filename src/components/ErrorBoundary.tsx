import React, { ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    showDetails: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        showDetails: false,
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info)
    }

    toggleDetails = () => {
        this.setState(({ showDetails }) => ({ showDetails: !showDetails }))
    }

    reloadPage = () => {
        window.location.reload()
    }

    render() {
        const { hasError, error, showDetails } = this.state

        if (hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-card">
                        <h1 className="error-boundary-title">Oops! Something went wrong.</h1>
                        <p className="error-boundary-text">
                            Please reveal the error details below, take a screenshot, and then report it here:{' '}
                            <a
                                href="https://github.com/Stannnnn/jelly-app/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="error-boundary-link"
                            >
                                Report Issue
                            </a>
                        </p>
                        <div className="error-boundary-buttons">
                            <button onClick={this.toggleDetails} className="btn-details">
                                {showDetails ? 'Hide Details' : 'Reveal Error'}
                            </button>
                            <button onClick={this.reloadPage} className="btn-reload">
                                Reload Page
                            </button>
                        </div>
                        {showDetails && error && (
                            <pre className="error-boundary-details">{error.stack || error.toString()}</pre>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
