import { createContext } from 'react'
import { IDropdownContext } from './DropdownContextProvider'

export const DropdownContext = createContext<IDropdownContext>({} as IDropdownContext)
