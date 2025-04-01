import { createContext, ReactNode, useContext, useState } from 'react'

type InitialState = ReturnType<typeof useInitialState>

const useInitialState = () => {
    const [pageTitle, setPageTitle] = useState('')

    return {
        pageTitle,
        setPageTitle,
    }
}

export const PageTitleContext = createContext<InitialState>({} as InitialState)

export const usePageTitle = () => useContext(PageTitleContext)

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
    const initialState = useInitialState()

    return <PageTitleContext.Provider value={initialState}>{children}</PageTitleContext.Provider>
}
