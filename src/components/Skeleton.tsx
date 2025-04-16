import './Skeleton.css'

interface SkeletonProps {
    type?: 'song' | 'album' | 'playlist'
}

const Skeleton = ({ type = 'album' }: SkeletonProps) => (
    <div className="skeleton-loading">
        <div className={`skeleton-effect thumbnail ${type === 'playlist' ? 'playlist' : ''}`}></div>
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
            {type === 'playlist' && (
                <>
                    <div className="skeleton-effect playlist title"></div>
                    <div className="skeleton-effect playlist artist"></div>
                </>
            )}
        </div>
        {type === 'playlist' && (
            <div className="skeleton-indicators">
                <div className="skeleton-effect duration"></div>
            </div>
        )}
    </div>
)

export default Skeleton
