import { ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HistoryContext } from './HistoryContext'

export type IHistoryContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [historyStack, setHistoryStack] = useState<string[]>([])
    const navigate = useNavigate()
    const location = useLocation()
    const currentLocation = location.pathname + location.search

    useEffect(() => {
        if (historyStack[historyStack.length - 1] === currentLocation) return

        setHistoryStack(prev => [...prev, currentLocation])
    }, [currentLocation]) // eslint-disable-line react-hooks/exhaustive-deps

    const goBack = () => {
        if (historyStack.length <= 1) {
            navigate('/')
            return
        }

        setHistoryStack(prev => {
            let newStack = prev.slice(0, -1)

            while (newStack[newStack.length - 1].startsWith('/lyrics') && newStack.length >= 1) {
                newStack = newStack.slice(0, -1)
            }

            if (newStack.length <= 0) {
                navigate('/')
                return []
            }

            navigate(newStack[newStack.length - 1])
            return newStack
        })
    }

    return { goBack }
}

export const HistoryContextProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <HistoryContext.Provider value={initialState}>{children}</HistoryContext.Provider>
}
