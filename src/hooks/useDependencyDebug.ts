import { useEffect, useRef } from 'react'

export const useDependencyDebug = (deps: any[], name = 'deps') => {
    const prev = useRef<any[]>([])

    useEffect(() => {
        deps.forEach((dep, i) => {
            if (dep !== prev.current[i]) {
                console.log(`[${name}] Dependency[${i}] changed`, {
                    prev: prev.current[i],
                    next: dep,
                })
            }
        })
        prev.current = deps
    }, deps)
}
