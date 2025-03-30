import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

type InitialState = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [disabled, setDisabled] = useState(false)

    useEffect(() => {
        const body = document.getElementsByTagName('body')[0]

        if (disabled) {
            body.classList.add('lockscroll')
        } else {
            body.classList.remove('lockscroll')
        }

        return () => {
            body.classList.remove('lockscroll')
        }
    }, [disabled])

    return {
        disabled,
        setDisabled,
    }
}

export const ScrollContext = createContext<InitialState>({} as InitialState)
export const useScrollContext = () => useContext(ScrollContext)

export const ScrollContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <ScrollContext.Provider value={initialState}>{children}</ScrollContext.Provider>
}
