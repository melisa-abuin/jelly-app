import { createContext, ReactNode, useContext } from 'react'
import { PlaybackManagerProps, useP__laybackManager } from '../components/PlaybackManager'

type InitialState = ReturnType<typeof useInitialState>

const useInitialState = (props: PlaybackManagerProps) => {
    const playbackManager = useP__laybackManager(props)

    return playbackManager
}

export const PlaybackContext = createContext<InitialState>({} as InitialState)

export const usePlaybackContext = () => useContext(PlaybackContext)

export const PlaybackContextProvider = (props: { children: ReactNode } & PlaybackManagerProps) => {
    const { children, ...rest } = props
    const initialState = useInitialState(rest)

    return <PlaybackContext.Provider value={initialState}>{children}</PlaybackContext.Provider>
}
