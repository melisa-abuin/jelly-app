import { createContext, useContext } from 'react'
import { IFilterContext } from './FilterContextProvider'

export const FilterContext = createContext<IFilterContext>({} as IFilterContext)

export const useFilterContext = () => useContext(FilterContext)
