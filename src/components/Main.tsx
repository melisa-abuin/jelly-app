import { ArrowLeftIcon, BookmarkFillIcon, ChevronDownIcon, HeartFillIcon } from '@primer/octicons-react'
import { CSSProperties, ReactElement, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDropdownContext } from '../context/DropdownContext/DropdownContext'
import { useFilterContext } from '../context/FilterContext/FilterContext'
import { FilterContextProvider } from '../context/FilterContext/FilterContextProvider'
import { useHistoryContext } from '../context/HistoryContext/HistoryContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useSidenavContext } from '../context/SidenavContext/SidenavContext'
import { getPageTitle } from '../utils/titleUtils'
import { AlbumIcon, ArtistsIcon, PlaylistIcon, TracksIcon } from './SvgIcons'

export const Main = (props: Parameters<typeof MainContent>[0]) => {
    return (
        <FilterContextProvider key={(props.content?.type as { name?: string })?.name}>
            <MainContent {...props} />
        </FilterContextProvider>
    )
}

export const MainContent = ({
    content,
    filterType,
    dropdownType,
}: {
    content: ReactElement
    filterType?: 'mediaItems' | 'favorites'
    dropdownType?: 'default' | 'album' | 'artist'
}) => {
    const playback = usePlaybackContext()
    const { pageTitle } = usePageTitle()
    const { goBack: previousPage } = useHistoryContext()
    const location = useLocation()
    const { toggleSidenav } = useSidenavContext()
    const { sort, setSort } = useFilterContext()
    const { setHidden } = useDropdownContext()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    useEffect(() => {
        setHidden(
            dropdownType === 'album'
                ? {
                      view_album: true,
                  }
                : dropdownType === 'artist'
                ? {
                      view_artist: true,
                      view_artists: true,
                  }
                : {}
        )
    }, [dropdownType, setHidden])

    return (
        <main className="main">
            <div className="main_header">
                <div className="primary">
                    <div onClick={previousPage} className="return_icon" title="Back">
                        <ArrowLeftIcon size={16}></ArrowLeftIcon>
                    </div>
                    <div className="container">
                        <div className="page_title">
                            <div className="text" title={getPageTitle(pageTitle, location)}>
                                {getPageTitle(pageTitle, location)}
                            </div>
                            {location.pathname.startsWith('/album/') && pageTitle && (
                                <div className="page-icon album" title="Album">
                                    <AlbumIcon width={16} height={16} />
                                </div>
                            )}
                            {pageTitle &&
                                (location.pathname.match(/^\/artist\/[^/]+\/tracks$/) ? (
                                    <div className="page-icon artist-tracks" title="Tracks">
                                        <TracksIcon width={12} height={12} />
                                    </div>
                                ) : location.pathname.startsWith('/artist/') ? (
                                    <div className="page-icon artist" title="Artist">
                                        <ArtistsIcon width={16} height={16} />
                                    </div>
                                ) : null)}
                            {location.pathname.startsWith('/genre/') && pageTitle && (
                                <div className="page-icon genre" title="Genre">
                                    <BookmarkFillIcon size={16} />
                                </div>
                            )}
                            {location.pathname.startsWith('/playlist/') && pageTitle && (
                                <div className="page-icon playlist" title="Playlist">
                                    <PlaylistIcon width={12} height={12} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="secondary">
                    {filterType === 'mediaItems' && (
                        <div className="filter">
                            <select onChange={e => setSort(e.target.value)} value={sort}>
                                <option value="Added">Added</option>
                                <option value="Released">Released</option>
                                <option value="Runtime">Runtime</option>
                                <option value="Random">Random</option>
                            </select>
                            <div className="icon">
                                <ChevronDownIcon size={12} />
                            </div>
                        </div>
                    )}

                    {filterType === 'favorites' && (
                        <div className="filter">
                            <select onChange={e => setSort(e.target.value)} value={sort}>
                                <option value="Tracks">Tracks</option>
                                <option value="Albums">Albums</option>
                                <option value="Artists">Artists</option>
                            </select>
                            <div className="icon">
                                <ChevronDownIcon size={12} />
                            </div>
                        </div>
                    )}

                    <div className="sidenav_toggle noSelect" onClick={toggleSidenav}>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </div>
                </div>
            </div>
            <div className="main_content">{content}</div>
            <div className="main_footer">
                <div
                    className={
                        playback.isPlaying ? 'playback playing' : playback.currentTrack ? 'playback paused' : 'playback'
                    }
                >
                    <div className="progress">
                        <input
                            type="range"
                            id="track-progress"
                            name="track-progress"
                            min="0"
                            max={playback.duration || 1}
                            step="0.01"
                            value={playback.progress}
                            style={
                                {
                                    '--progress-width': `${
                                        playback.duration ? (playback.progress / playback.duration) * 100 : 0
                                    }%`,
                                    '--buffered-width': `${
                                        playback.duration ? (playback.buffered / playback.duration) * 100 : 0
                                    }%`,
                                } as CSSProperties
                            }
                            onChange={playback.handleSeek}
                        />
                    </div>
                    <div className="container">
                        <div className="track-info">
                            <div className="track-name">
                                <div className="text" title={playback.currentTrack?.Name || 'No Track Played'}>
                                    {playback.currentTrack?.Name ? (
                                        <Link to="/queue">{playback.currentTrack.Name}</Link>
                                    ) : (
                                        'No Track Played'
                                    )}
                                </div>
                                {playback.currentTrack?.UserData?.IsFavorite && (
                                    <span className="favorited" title="Favorited">
                                        <HeartFillIcon size={12}></HeartFillIcon>
                                    </span>
                                )}
                            </div>
                            <div
                                className="artist"
                                title={
                                    playback.currentTrack?.Artists?.join(', ') ||
                                    playback.currentTrack?.AlbumArtist ||
                                    'No Artist'
                                }
                            >
                                {playback.currentTrack &&
                                playback.currentTrack.ArtistItems &&
                                playback.currentTrack.ArtistItems.length > 0
                                    ? (() => {
                                          const artistItems = playback.currentTrack.ArtistItems
                                          return artistItems.map((artist, index) => (
                                              <span key={artist.Id}>
                                                  <Link to={`/artist/${artist.Id}`} className="text">
                                                      {artist.Name}
                                                  </Link>
                                                  {index < artistItems.length - 1 && ', '}
                                              </span>
                                          ))
                                      })()
                                    : playback.currentTrack?.Artists?.join(', ') ||
                                      playback.currentTrack?.AlbumArtist ||
                                      'No Artist'}
                            </div>
                            <div className="album">
                                {playback.currentTrack?.Album ? (
                                    <Link
                                        to={`/album/${playback.currentTrack.AlbumId}`}
                                        className="text"
                                        title={playback.currentTrack.Album}
                                    >
                                        {playback.currentTrack.Album}
                                    </Link>
                                ) : (
                                    <div className="text">No Album</div>
                                )}
                                <div className="album-icon" title="Album">
                                    <AlbumIcon width={12} height={12} />
                                </div>
                            </div>
                        </div>
                        <div className="controls">
                            <div className="knobs">
                                <div
                                    className={`shuffle ${playback.shuffle ? 'active' : ''}`}
                                    onClick={playback.toggleShuffle}
                                    title="Shuffle"
                                >
                                    <div className="shuffle-icon"></div>
                                </div>
                                <div className="primary">
                                    <div className="previous" onClick={playback.previousTrack} title="Previous">
                                        <div className="previous-icon"></div>
                                    </div>
                                    <div className="container">
                                        <div className="play" onClick={playback.togglePlayPause} title="Play">
                                            <div className="play-icon"></div>
                                        </div>
                                        <div className="pause" onClick={playback.togglePlayPause} title="Pause">
                                            <div className="pause-icon"></div>
                                        </div>
                                    </div>
                                    <div className="next" onClick={playback.nextTrack} title="Next">
                                        <div className="next-icon"></div>
                                    </div>
                                </div>
                                <div
                                    className={`repeat ${playback.repeat === 'off' ? '' : 'active'}`}
                                    onClick={playback.toggleRepeat}
                                    title="Repeat"
                                >
                                    <div className={`repeat-icon${playback.repeat === 'one' ? '-one' : ''}`}></div>
                                </div>
                            </div>
                            <div className="duration noSelect">
                                <div className="current">{playback.formatTime(playback.progress)}</div>
                                <div className="divider">/</div>
                                <div className="total">{playback.formatTime(playback.duration)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
