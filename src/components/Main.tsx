import { ArrowLeftIcon, BookmarkFillIcon, ChevronDownIcon, HeartFillIcon } from '@primer/octicons-react'
import { memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react'
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
    const audio = playback.audioRef.current
    const progressRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [location.pathname])

    useEffect(() => {
        setHidden(
            dropdownType === 'album'
                ? { view_album: true }
                : dropdownType === 'artist'
                ? { view_artist: true, view_artists: true }
                : {}
        )
    }, [dropdownType, setHidden])

    useEffect(() => {
        if (!audio || !progressRef.current) return
        const input = progressRef.current

        const setBuffered = () => {
            const d = audio.duration || 1
            const end = audio.buffered.length > 0 ? audio.buffered.end(audio.buffered.length - 1) : 0
            input.style.setProperty('--buffered-width', `${(end / d) * 100}%`)
        }

        const setProgressNow = (time: number) => {
            const d = audio.duration || 1
            input.style.setProperty('--progress-width', `${(time / d) * 100}%`)
        }

        const startAnimation = () => {
            if (isNaN(audio.duration) || audio.duration === 0) return
            const currentTime = audio.currentTime || 0
            const remaining = audio.duration - currentTime
            // Delay to ensure initial position is rendered
            setTimeout(() => {
                input.style.setProperty('--transition-duration', `${remaining}s`)
                input.style.setProperty('--progress-width', `100%`)
            }, 0)
            input.max = String(audio.duration)
            input.value = String(currentTime)
        }

        const onPlay = () => {
            startAnimation()
        }

        const onPause = () => {
            input.style.setProperty('--transition-duration', `0s`)
            setProgressNow(audio.currentTime)
            input.max = String(audio.duration || 0)
            input.value = String(audio.currentTime || 0)
        }

        const onSeeked = () => {
            if (isNaN(audio.duration) || audio.duration === 0) return
            input.style.setProperty('--transition-duration', `0s`)
            setProgressNow(audio.currentTime)
            input.value = String(audio.currentTime)
            input.max = String(audio.duration)
            if (!audio.paused) startAnimation()
        }

        const onLoaded = () => {
            if (!isNaN(audio.duration) && audio.duration > 0) {
                const currentTime = audio.currentTime || 0
                input.max = String(audio.duration)
                input.value = String(currentTime)
                input.style.setProperty('--transition-duration', `0s`)
                setProgressNow(currentTime)
                setBuffered()
            } else {
                input.max = '0'
                input.value = '0'
                input.style.setProperty('--progress-width', '0%')
                input.style.setProperty('--buffered-width', '0%')
                input.style.setProperty('--transition-duration', `0s`)
            }
        }

        const resetBars = () => {
            input.style.setProperty('--transition-duration', '0s')
            input.style.setProperty('--progress-width', '0%')
            input.style.setProperty('--buffered-width', '0%')
            input.value = '0'
            input.max = '0'
        }

        const mo = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.attributeName === 'src') {
                    resetBars()
                    audio.load()
                }
            }
        })

        mo.observe(audio, { attributes: true, attributeFilter: ['src'] })

        audio.addEventListener('play', onPlay)
        audio.addEventListener('pause', onPause)
        audio.addEventListener('seeked', onSeeked)
        audio.addEventListener('progress', setBuffered)
        audio.addEventListener('loadedmetadata', onLoaded)
        audio.addEventListener('durationchange', onLoaded)
        audio.addEventListener('emptied', resetBars)

        onLoaded()
        if (!audio.paused && !isNaN(audio.duration) && audio.duration > 0) {
            startAnimation()
        }

        return () => {
            audio.removeEventListener('play', onPlay)
            audio.removeEventListener('pause', onPause)
            audio.removeEventListener('seeked', onSeeked)
            audio.removeEventListener('progress', setBuffered)
            audio.removeEventListener('loadedmetadata', onLoaded)
            audio.removeEventListener('durationchange', onLoaded)
            audio.removeEventListener('emptied', resetBars)
            mo.disconnect()
        }
    }, [audio])

    const memoHeader = useMemo(() => {
        return (
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
        )
    }, [filterType, location, pageTitle, previousPage, setSort, sort, toggleSidenav])

    const memoFooter = useMemo(() => {
        return (
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
                            step="0.01"
                            min="0"
                            ref={progressRef}
                            onChange={e => {
                                if (!audio) return
                                const t = parseFloat(e.currentTarget.value)
                                audio.currentTime = t
                                const input = progressRef.current!
                                input.style.setProperty('--transition-duration', '0s')
                                input.style.setProperty(
                                    '--progress-width',
                                    `${isNaN(audio.duration) || audio.duration === 0 ? 0 : (t / audio.duration) * 100}%`
                                )
                                input.value = String(t)
                            }}
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

                            <Duration />
                        </div>
                    </div>
                </div>
            </div>
        )
    }, [
        audio,
        playback.currentTrack,
        playback.isPlaying,
        playback.nextTrack,
        playback.previousTrack,
        playback.repeat,
        playback.shuffle,
        playback.togglePlayPause,
        playback.toggleRepeat,
        playback.toggleShuffle,
    ])

    return (
        <main className="main">
            {memoHeader}
            <div className="main_content">{content}</div>
            {memoFooter}
        </main>
    )
}

const Duration = memo(() => {
    const playback = usePlaybackContext()
    const audio = playback.audioRef.current

    const [progress, setProgress] = useState(audio.currentTime || 0)
    const [duration, setDuration] = useState(audio.duration || 0)

    useEffect(() => {
        if (!audio) return

        const updateProgress = () => {
            setProgress(audio.currentTime)
            setDuration(audio.duration)
        }

        audio.addEventListener('timeupdate', updateProgress)
        audio.addEventListener('loadedmetadata', updateProgress)

        return () => {
            audio.removeEventListener('timeupdate', updateProgress)
            audio.removeEventListener('loadedmetadata', updateProgress)
        }
    }, [audio])

    return (
        <div className="duration noSelect">
            <div className="current">{playback.formatTime(progress)}</div>
            <div className="divider">/</div>
            <div className="total">{playback.formatTime(duration)}</div>
        </div>
    )
})
