import { getSvgPath } from 'figma-squircle'
import { ReactNode, useMemo } from 'react'

// Cache SVG paths for common configurations to avoid recalculating
const pathCache = new Map<string, string>()

const getCachedSvgPath = (width: number, height: number, cornerRadius: number, cornerSmoothing: number) => {
    const cacheKey = `${width}-${height}-${cornerRadius}-${cornerSmoothing}`
    if (!pathCache.has(cacheKey)) {
        const path = getSvgPath({
            width,
            height,
            cornerRadius,
            cornerSmoothing,
        })
        pathCache.set(cacheKey, path)
    }
    return pathCache.get(cacheKey)!
}

interface SquircleProps {
    width: number
    height: number
    cornerRadius?: number
    cornerSmoothing?: number
    useSquircle?: boolean
    className?: string
    children: ReactNode
}

export const Squircle = ({
    width,
    height,
    cornerRadius,
    cornerSmoothing = 0.8,
    useSquircle = true,
    className,
    children,
}: SquircleProps) => {
    // Determine default cornerRadius based on dimensions if not provided
    const effectiveCornerRadius = useMemo(() => {
        if (cornerRadius !== undefined) return cornerRadius
        const size = Math.min(width, height)
        if (size <= 40) return 6
        if (size <= 46) return 6
        if (size <= 100) return 8
        return size * 0.08
    }, [cornerRadius, width, height])

    // Compute squircle path only if useSquircle is true
    const svgPath = useMemo(() => {
        if (!useSquircle) return null
        return getCachedSvgPath(width, height, effectiveCornerRadius, cornerSmoothing)
    }, [width, height, effectiveCornerRadius, cornerSmoothing, useSquircle])

    return (
        <div
            className={className}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                clipPath: svgPath ? `path('${svgPath}')` : undefined,
                borderRadius: !svgPath ? `${effectiveCornerRadius}px` : undefined,
                overflow: 'hidden',
            }}
        >
            {children}
        </div>
    )
}
