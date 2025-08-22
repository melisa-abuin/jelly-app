import { HeartFillIcon } from '@primer/octicons-react'
import { InfiniteData } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Virtuoso } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useDisplayItems } from '../hooks/useDisplayItems'
import { formatDuration } from '../utils/formatDuration'
import { JellyImg } from './JellyImg'
import { Loader } from './Loader'
import { IReviver } from './PlaybackManager'
import './PlaylistTrackList.css'
import { Skeleton } from './Skeleton'
import { Squircle } from './Squircle'
import { DeletingIcon, DownloadedIcon, DownloadingIcon, PlaystateAnimationTracklist } from './SvgIcons'

export const PlaylistTrackList = ({
    tracks,
    infiniteData = { pageParams: [], pages: [] },
    isLoading,
    playlistId,
    showType,
    title,
    disableUrl,
    reviver,
    loadMore,
}: {
    tracks: MediaItem[]
    infiniteData: InfiniteData<MediaItem[], unknown> | undefined
    isLoading: boolean
    playlistId?: string
    showType?: 'artist' | 'album'
    title: string
    disableUrl?: boolean
    reviver?: IReviver
    loadMore?: () => void
}) => {
    const playback = usePlaybackContext()
    const location = useLocation()
    const { displayItems, setRowRefs } = useDisplayItems(tracks, isLoading)

    const dropdown = useDropdownContext()

    const handleTrackClick = useCallback(
        (track: MediaItem, index: number) => {
            if (playback.currentTrack?.Id === track.Id) {
                playback.togglePlayPause()
            } else {
                if (playback.setCurrentPlaylist({ pages: infiniteData, title, disableUrl, reviver })) {
                    playback.playTrack(index)
                }
            }
        },
        [playback, infiniteData, title, disableUrl, reviver]
    )

    const renderTrack = (index: number, item: MediaItem | { isPlaceholder: true }) => {
        if ('isPlaceholder' in item) {
            return (
                <li className="track-item" ref={el => setRowRefs(index, el)}>
                    <Skeleton type="playlist" />
                </li>
            )
        }

        const track = item
        const isActive = dropdown.selectedItem?.Id === item.Id && dropdown.isOpen

        const trackClass = [
            playback.currentTrack?.Id === track.Id ? (playback.isPlaying ? 'playing' : 'paused') : '',
            isActive ? 'active' : '',
        ]
            .filter(Boolean)
            .join(' ')

        const isFavorite = track.UserData?.IsFavorite && location.pathname !== '/favorites'

        return (
            <li
                className={`track-item ${trackClass}`}
                onClick={() => handleTrackClick(track, index)}
                key={track.Id}
                ref={el => setRowRefs(index, el)}
                onContextMenu={e => dropdown.onContextMenu(e, { item, playlistId })}
                onTouchStart={e => dropdown.onTouchStart(e, { item, playlistId })}
                onTouchMove={dropdown.onTouchClear}
                onTouchEnd={dropdown.onTouchClear}
            >
                <Squircle width={40} height={40} cornerRadius={6} className="track-state">
                    <JellyImg item={track} type={'Primary'} width={40} height={40} />

                    <div className="overlay">
                        <div className="container">
                            <div className="play">
                                <div className="play-icon"></div>
                            </div>
                            <div className="pause">
                                <div className="pause-icon"></div>
                            </div>
                        </div>
                        <div className="play-state-animation">
                            <PlaystateAnimationTracklist width={18} height={18} className="sound-bars" />
                        </div>
                    </div>
                </Squircle>
                <div className="track-details">
                    <span className="track-name">
                        <span className="track-number">{index + 1}.</span>
                        {track.Name}
                    </span>
                    <div className="container">
                        {showType === 'artist' ? (
                            <div className="artist">
                                {track.Artists && track.Artists.length > 0
                                    ? track.Artists.join(', ')
                                    : 'Unknown Artist'}
                            </div>
                        ) : showType === 'album' ? (
                            <div className="album">{track.Album || 'Unknown Album'}</div>
                        ) : (
                            <>
                                <div className="artist">
                                    {track.Artists && track.Artists.length > 0
                                        ? track.Artists.join(', ')
                                        : 'Unknown Artist'}
                                </div>
                                <div className="divider"></div>
                                <div className="album">{track.Album || 'Unknown Album'}</div>
                            </>
                        )}
                    </div>
                </div>
                <div className="track-indicators">
                    {track.offlineState && (
                        <div className="download-state">
                            {track.offlineState === 'downloading' && (
                                <div className="icon downloading" title="Syncing...">
                                    <DownloadingIcon width={12} height={12} />
                                </div>
                            )}

                            {track.offlineState === 'downloaded' && (
                                <div className="icon downloaded" title="Synced">
                                    <DownloadedIcon width={12} height={12} />
                                </div>
                            )}

                            {track.offlineState === 'deleting' && (
                                <div className="icon deleting" title="Unsyncing...">
                                    <DeletingIcon width={12} height={12} />
                                </div>
                            )}
                        </div>
                    )}
                    {isFavorite && (
                        <div className="favorited" title="Favorited">
                            <HeartFillIcon size={12} />
                        </div>
                    )}
                    <div className="track-duration">{formatDuration(track.RunTimeTicks || 0)}</div>
                </div>
            </li>
        )
    }

    if (isLoading && tracks.length === 0) {
        return <Loader />
    }

    if (!isLoading && tracks.length === 0) {
        return <div className="empty">No tracks were found</div>
    }

    return (
        <ul className="playlist-tracklist noSelect">
            <Virtuoso
                key={playlistId}
                data={displayItems}
                useWindowScroll
                itemContent={renderTrack}
                endReached={loadMore}
                overscan={800}
            />
        </ul>
    )
}
