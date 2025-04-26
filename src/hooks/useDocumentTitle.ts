import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { getPageTitle } from '../utils/titleUtils'

export const useDocumentTitle = () => {
    const { currentTrack, isPlaying } = usePlaybackContext()
    const { pageTitle } = usePageTitle()
    const location = useLocation()

    useEffect(() => {
        if (currentTrack && isPlaying) {
            const artist = currentTrack.AlbumArtist || currentTrack.Artists?.[0] || 'Unknown Artist'
            document.title = `${currentTrack.Name} - ${artist}`
        } else {
            document.title = `${getPageTitle(pageTitle, location)} - Jellyfin Music App`
        }
    }, [currentTrack, isPlaying, pageTitle, location.pathname, location])
}
