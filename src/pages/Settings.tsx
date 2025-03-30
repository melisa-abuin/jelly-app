import { useNavigate } from 'react-router-dom'

interface SettingsProps {
    onLogout: () => void
}

const Settings = ({ onLogout }: SettingsProps) => {
    const navigate = useNavigate()

    const handleLogout = () => {
        onLogout()
        navigate('/login')
    }

    return (
        <div className="settings">
            <p>Appearance - Follow the System theme, manual override to day/night themes.</p>
            <br />
            <p>
                Audio Quality - Some options to enable transcoding, the audio will be converted to AAC 320kbps on the
                fly, maybe a bitrate selection? This would "only" make sense for mobile devices where bandwidth could be
                a constraint?
            </p>
            <br />
            <p>
                Some info about which jellyfin server you're currently connected to, maybe some stats around that?
                Connected with the logout btn below in some way
            </p>
            <br />
            <button onClick={handleLogout} className="logout-button noSelect">
                Logout
            </button>
        </div>
    )
}

export default Settings
