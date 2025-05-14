import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export const useSidenav = () => {
    const [showSidenav, setShowSidenav] = useState(false)
    const location = useLocation()

    // Close sidenav on route change if location is provided
    useEffect(() => {
        if (location?.pathname) {
            setShowSidenav(false)
        }
    }, [location?.pathname])

    // Toggle lockscroll on body
    useEffect(() => {
        if (showSidenav) {
            document.body.classList.add('lockscroll')
        } else {
            document.body.classList.remove('lockscroll')
        }

        return () => {
            document.body.classList.remove('lockscroll')
        }
    }, [showSidenav])

    const toggleSidenav = () => {
        setShowSidenav(current => !current)
    }

    const closeSidenav = () => {
        setShowSidenav(false)
    }

    return { showSidenav, toggleSidenav, closeSidenav }
}
