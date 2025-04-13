import './Skeleton.css'

interface SkeletonProps {
    type?: 'song' | 'album'
}

const Skeleton = ({ type = 'album' }: SkeletonProps) => (
    <div className="skeleton-loading">
        <div className="skeleton-effect thumbnail"></div>
        <div className="skeleton-details">
            {type === 'album' && (
                <>
                    <div className="skeleton-effect album title"></div>
                    <div className="skeleton-effect album artist"></div>
                </>
            )}
            {type === 'song' && (
                <>
                    <div className="skeleton-effect track title"></div>
                    <div className="skeleton-effect track artist"></div>
                </>
            )}
        </div>
    </div>
)

export default Skeleton
