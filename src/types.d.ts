import { MediaItem } from './api/jellyfin'
import { IAudioStorageContext } from './context/AudioStorageContext/AudioStorageContextProvider'

declare global {
    interface Window {
        __NPM_LIFECYCLE_EVENT__: string
        audioStorage: IAudioStorageContext
        addToDownloads: (items: MediaItem[], containerId?: MediaItem) => void
    }

    const __VERSION__: string
}

export {}
