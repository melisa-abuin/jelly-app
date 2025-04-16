import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'

export const JellyImg = ({
    item,
    type,
    width,
    height,
    imageProps,
}: {
    item: MediaItem
    type: 'Primary' | 'Backdrop'
    width: number
    height: number
    imageProps?: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
}) => {
    const api = useJellyfinContext()

    return (
        <img
            {...imageProps}
            src={api.getImageUrl(item, type, { width, height })}
            alt={item.Name}
            className="thumbnail"
            loading="lazy"
            onError={e => {
                ;(e.target as HTMLImageElement).src = '/default-thumbnail.png'
            }}
        />
    )
}
