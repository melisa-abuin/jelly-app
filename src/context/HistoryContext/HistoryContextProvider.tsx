import { ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HistoryContext } from './HistoryContext'

export type IHistoryContext = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [historyStack, setHistoryStack] = useState<string[]>([])
    const navigate = useNavigate()
    const { pathname } = useLocation()

    useEffect(() => {
        if (historyStack[historyStack.length - 1] === pathname) return

        setHistoryStack(prev => [...prev, pathname])
    }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    const goBack = () => {
        if (historyStack.length <= 1) {
            navigate('/')
            return
        }

        setHistoryStack(prev => {
            const newStack = prev.slice(0, -1)
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
