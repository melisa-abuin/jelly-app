import { InfiniteData, useQueryClient } from '@tanstack/react-query'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { IJellyfinInfiniteProps, useJellyfinInfiniteData } from '../hooks/Jellyfin/Infinite/useJellyfinInfiniteData'

export type IReviver = {
    queryKey: unknown[]
    queryFn?: { fn: string; params: unknown[] }
}

export const ___PAGE_PARAM_INDEX___ = '___PAGE_PARAM_INDEX___'

export type PlaybackManagerProps = {
    initialVolume: number
    clearOnLogout?: boolean
}

export const usePlaybackManager = ({ initialVolume, clearOnLogout }: PlaybackManagerProps) => {
    const api = useJellyfinContext()
    // Session based play count for settings page
    const [sessionPlayCount, setSessionPlayCount] = useState(() => {
        const saved = localStorage.getItem('sessionPlayCount')
        return saved ? Number(saved) : 0
    })
    const [currentTrackIndex, setCurrentTrackIndex] = useState({
        index: localStorage.getItem('currentTrackIndex') ? Number(localStorage.getItem('currentTrackIndex')) : -1,
    })
    const [isPlaying, setIsPlaying] = useState(false)

    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem('volume')
        return savedVolume ? parseFloat(savedVolume) : initialVolume
    })

    const [shuffle, setShuffle] = useState(false)
    const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>(() => {
        const savedRepeat = localStorage.getItem('repeatMode')
        return savedRepeat === 'all' || savedRepeat === 'one' ? savedRepeat : 'off'
    })
    const audioRef = useRef<HTMLAudioElement>(new Audio())
    const shuffledPlaylist = useRef<number[]>([])
    const [currentShuffledIndex, setCurrentShuffledIndex] = useState({ index: -1 })
    const playedIndices = useRef<Set<number>>(new Set())
    const hasRestored = useRef(false)
    const queryClient = useQueryClient()

    const [playlistTitle, setPlaylistTitle] = useState('')
    const [reviver, setReviver] = useState<IReviver>(JSON.parse(localStorage.getItem('reviver') || '{}') || {})

    const reviverFn = useMemo(() => {
        const queryFn = reviver.queryFn?.fn || ''
        const params = reviver.queryFn?.params || []

        const pageParamIndex = params.findIndex(param => param === ___PAGE_PARAM_INDEX___)
        const itemsPerPage = params[pageParamIndex + 1]

        return {
            queryKey: ['reviver', ...(reviver.queryKey || [])],
            queryFn: async ({ pageParam = 0 }) => {
                const startIndex = (pageParam as number) * (itemsPerPage as number)

                params[pageParamIndex] = startIndex

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (await (api as any)[queryFn]?.(...params)) || []
            },
            queryFnReviver: undefined,
            // NOTE; The reviverPageIndex is probably wrong but its not really an issue for now
            initialPageParam: Number(localStorage.getItem('reviverPageIndex')) || 0,
        } satisfies IJellyfinInfiniteProps
    }, [api, reviver.queryFn, reviver.queryKey])

    const { items, hasNextPage, loadMore } = useJellyfinInfiniteData(reviverFn)

    const setCurrentPlaylist = useCallback(
        (props: { playlist: MediaItem[]; title: string; reviver?: IReviver }) => {
            if (shuffle) {
                setShuffle(false)
            }

            localStorage.setItem('reviver', JSON.stringify(props.reviver || {}))

            queryClient.setQueryData(['reviver', ...(props.reviver?.queryKey || [])], {
                pageParams: [1],
                pages: [props.playlist],
            } satisfies InfiniteData<MediaItem[], unknown>)

            setReviver(props.reviver || ({} as IReviver))

            setPlaylistTitle(props.title)
        },
        [queryClient, shuffle]
    )

    const abortControllerRef = useRef<AbortController | null>(null)

    const [userInteracted, setUserInteracted] = useState(false)

    const currentTrack = useMemo(() => {
        return (
            items[shuffle ? shuffledPlaylist.current.indexOf(currentShuffledIndex.index) : currentTrackIndex.index] ||
            null
        )
    }, [currentShuffledIndex.index, currentTrackIndex.index, items, shuffle])

    // Update Media Session metadata
    const updateMediaSessionMetadata = useCallback(
        (track: MediaItem) => {
            if ('mediaSession' in navigator) {
                const artworkUrl = api.getImageUrl(track, 'Primary', { width: 512, height: 512 })

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.Name || 'Unknown Track',
                    artist: track.Artists?.join(', ') || track.AlbumArtist || 'Unknown Artist',
                    album: track.Album || 'Unknown Album',
                    artwork: artworkUrl
                        ? [
                              {
                                  src: artworkUrl,
                                  sizes: '512x512',
                                  type: 'image/webp',
                              },
                          ]
                        : [],
                })
            }
        },
        [api]
    )

    useEffect(() => {
        if (!isPlaying || !currentTrack) return

        const interval = setInterval(() => {
            api.reportPlaybackProgress(currentTrack.Id, audioRef.current.currentTime, false)
        }, 10000)

        return () => clearInterval(interval)
    }, [api, currentTrack, isPlaying])

    // Handle login/logout and sync to localStorage
    useEffect(() => {
        if (clearOnLogout || !api.auth.token) {
            setSessionPlayCount(0)
            localStorage.removeItem('sessionPlayCount')
        } else if (api.auth.token) {
            localStorage.setItem('sessionPlayCount', sessionPlayCount.toString())
        }
    }, [api.auth.token, clearOnLogout, sessionPlayCount])

    // Force session play count to reset
    const resetSessionCount = () => {
        setSessionPlayCount(0)
        localStorage.removeItem('sessionPlayCount')
    }

    const playTrack = useCallback(
        async (index: number) => {
            const track = items[index]

            if (!track) {
                return
            }

            if (track.pageIndex) {
                localStorage.setItem('reviverPageIndex', track.pageIndex.toString())
            } else {
                localStorage.removeItem('reviverPageIndex')
            }

            abortControllerRef.current?.abort('abort')
            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            if (audioRef.current) {
                const audio = audioRef.current
                if (currentTrack && isPlaying) {
                    await api.reportPlaybackStopped(currentTrack.Id, audio.currentTime, signal)
                }
                audio.pause()
                audio.currentTime = 0

                try {
                    const streamUrl = api.getStreamUrl(track.Id)
                    audio.src = streamUrl
                    audio.load()

                    await new Promise<void>((resolve, reject) => {
                        const onLoadedMetadata = async () => {
                            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
                            signal.removeEventListener('abort', onAbort)

                            try {
                                if (userInteracted) {
                                    await audio.play()
                                }
                            } catch (e) {
                                reject(e)
                            }

                            resolve()
                        }
                        const onAbort = () => {
                            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
                            resolve()
                        }
                        signal.addEventListener('abort', onAbort)
                        audio.addEventListener('loadedmetadata', onLoadedMetadata)
                    })

                    setSessionPlayCount(prev => {
                        const newCount = prev + 1
                        return newCount
                    })

                    playedIndices.current.add(index)
                    updateMediaSessionMetadata(track)

                    // Report playback start to Jellyfin
                    await api.reportPlaybackStart(track.Id, signal)
                } catch (error) {
                    console.error('Error playing track:', error)
                }
            }
        },
        [api, currentTrack, isPlaying, items, updateMediaSessionMetadata, userInteracted]
    )

    const togglePlayPause = useCallback(async () => {
        setUserInteracted(true)

        if (audioRef.current && currentTrack) {
            const audio = audioRef.current
            if (isPlaying) {
                audio.pause()
                await api.reportPlaybackProgress(currentTrack.Id, audio.currentTime, true)
            } else {
                if (!audio.src) {
                    const streamUrl = api.getStreamUrl(currentTrack.Id)
                    audio.src = streamUrl
                    audio.load()
                }

                try {
                    await audio.play()
                    await api.reportPlaybackProgress(currentTrack.Id, audio.currentTime, false)
                    updateMediaSessionMetadata(currentTrack)
                } catch (error) {
                    console.error('Error resuming playback:', error)
                    setCurrentTrackIndex({ index: -1 })

                    if (audioRef.current) {
                        audioRef.current.pause()
                        audioRef.current.src = ''
                    }
                }
            }
        }
    }, [api, currentTrack, isPlaying, updateMediaSessionMetadata])

    useEffect(() => {
        if (currentTrackIndex.index >= 0 && currentTrackIndex.index < items.length && items[currentTrackIndex.index]) {
            playTrack(currentTrackIndex.index)
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [currentTrackIndex]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (shuffle) {
            if (
                currentShuffledIndex.index >= 0 &&
                currentShuffledIndex.index < items.length &&
                items[currentShuffledIndex.index]
            ) {
                playTrack(shuffledPlaylist.current.indexOf(currentShuffledIndex.index))
            } else {
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            }
        }
    }, [currentShuffledIndex]) // eslint-disable-line react-hooks/exhaustive-deps

    const nextTrack = useCallback(async () => {
        setUserInteracted(true)

        if (!items || items.length === 0 || currentTrackIndex.index === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }

            return
        }

        if (repeat === 'one') {
            // If repeat is 'one', play the same track again, no need to change index
            setCurrentTrackIndex({ index: currentTrackIndex.index })
        } else if (shuffle) {
            const nextIndex = currentShuffledIndex.index + 1
            if (nextIndex >= shuffledPlaylist.current.length) {
                if (shuffledPlaylist.current.length) {
                    // todo; used to be loadMore but thats unrelated for this so ehh no idea what shud be here
                    setCurrentShuffledIndex({ index: nextIndex })
                    return
                } else if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(items.length).keys()]
                        .filter(i => i !== currentTrackIndex.index)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex.index !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex.index)
                    }

                    setCurrentShuffledIndex({ index: 0 })
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }

                    return
                }
            } else {
                setCurrentShuffledIndex({ index: nextIndex })
            }
        } else {
            const nextIndex = currentTrackIndex.index + 1
            if (nextIndex >= items.length) {
                if (await loadMore()) {
                    setCurrentTrackIndex({ index: nextIndex })
                } else {
                    if (repeat === 'all') {
                        setCurrentTrackIndex({ index: 0 })
                    } else {
                        if (audioRef.current) {
                            audioRef.current.pause()
                        }

                        return
                    }
                }
            } else {
                setCurrentTrackIndex({ index: nextIndex })
            }
        }
    }, [currentShuffledIndex.index, currentTrack, currentTrackIndex.index, items, loadMore, repeat, shuffle])

    const previousTrack = useCallback(async () => {
        setUserInteracted(true)

        if (!items || items.length === 0 || currentTrackIndex.index === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }

            return
        }

        if (repeat === 'one') {
            // If repeat is 'one', play the same track again, no need to change index
        } else if (shuffle) {
            const prevIndex = currentShuffledIndex.index - 1
            if (prevIndex < 0) {
                if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(items.length).keys()]
                        .filter(i => i !== currentTrackIndex.index)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex.index !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex.index)
                    }

                    setCurrentShuffledIndex({ index: shuffledPlaylist.current.length - 1 })
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }

                    return
                }
            } else {
                setCurrentShuffledIndex({ index: prevIndex })
            }
        } else {
            const prevIndex = currentTrackIndex.index - 1
            if (prevIndex < 0) {
                if (repeat === 'all') {
                    setCurrentTrackIndex({ index: items.length - 1 })
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }

                    return
                }
            } else {
                setCurrentTrackIndex({ index: prevIndex })
            }
        }
    }, [currentShuffledIndex.index, currentTrack, currentTrackIndex.index, items, repeat, shuffle])

    const toggleShuffle = () => {
        setShuffle(prev => {
            const newShuffle = !prev
            if (newShuffle) {
                playedIndices.current.clear()
                shuffledPlaylist.current = [...Array(items.length).keys()]
                    .filter(i => i !== currentTrackIndex.index)
                    .sort(() => Math.random() - 0.5)
                if (currentTrackIndex.index !== -1) {
                    shuffledPlaylist.current.unshift(currentTrackIndex.index)
                }

                setCurrentShuffledIndex({ index: 0 })

                if (currentTrack && currentTrackIndex.index !== -1) {
                    setCurrentTrackIndex({ index: currentTrackIndex.index })
                }
            } else {
                shuffledPlaylist.current = []
                setCurrentShuffledIndex({ index: -1 })
                playedIndices.current.clear()
            }
            return newShuffle
        })
    }

    const toggleRepeat = () => {
        setRepeat(prev => {
            const newRepeat = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'
            return newRepeat
        })
    }

    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            audioRef.current.currentTime = parseFloat(e.target.value)
        }
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === 0) return '0:00'
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        }
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    // Set initial volume
    useEffect(() => {
        audioRef.current.volume = volume
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Attach play/pause event listeners
    useEffect(() => {
        const audio = audioRef.current

        const handlePlay = () => {
            setIsPlaying(true)
        }

        const handlePause = () => {
            setIsPlaying(false)
        }

        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)

        return () => {
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
        }
    }, [])

    // Attach error event listeners
    useEffect(() => {
        const audio = audioRef.current

        const handleError = (e: Event) => {
            console.error('Audio error during playback:', e)
            setCurrentTrackIndex({ index: -1 })

            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }

        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('error', handleError)
        }
    }, [])

    // Set up Media Session API for next/previous actions
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('nexttrack', nextTrack)
            navigator.mediaSession.setActionHandler('previoustrack', previousTrack)
            navigator.mediaSession.setActionHandler('play', togglePlayPause)
            navigator.mediaSession.setActionHandler('pause', togglePlayPause)

            return () => {
                navigator.mediaSession.setActionHandler('nexttrack', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
            }
        }
    }, [nextTrack, previousTrack, togglePlayPause])

    useEffect(() => {
        localStorage.setItem('volume', volume.toString())
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    useEffect(() => {
        localStorage.setItem('repeatMode', repeat)
    }, [repeat])

    useEffect(() => {
        localStorage.setItem('currentTrackIndex', currentTrackIndex.index.toString())
    }, [currentTrackIndex])

    useEffect(() => {
        if (hasRestored.current) return
        hasRestored.current = true

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (api.auth.token) {
            const indexInPlaylist = Number(savedIndex)
            if (indexInPlaylist !== -1) {
                setCurrentTrackIndex({ index: currentTrackIndex.index })
            } else if (savedIndex) {
                setCurrentTrackIndex({ index: Number(savedIndex) })
            } else {
                setCurrentTrackIndex({ index: -1 })
            }

            const lastPlayedTrack = items[currentTrackIndex.index]

            if (lastPlayedTrack) {
                if (audioRef.current) {
                    const streamUrl = api.getStreamUrl(lastPlayedTrack.Id)
                    audioRef.current.src = streamUrl
                    audioRef.current.load()
                }
                updateMediaSessionMetadata(lastPlayedTrack)
            }
        } else if (!api.auth.token) {
            setCurrentTrackIndex({ index: -1 })
        }
    }, [api, currentTrackIndex.index, items, updateMediaSessionMetadata])

    useEffect(() => {
        if (shuffle && hasNextPage) {
            const threshold = 5
            if (currentShuffledIndex.index >= shuffledPlaylist.current.length - threshold) {
                loadMore()
            }
        }
    }, [currentShuffledIndex.index, hasNextPage, loadMore, shuffle])

    useEffect(() => {
        if (!audioRef.current) return

        const audio = audioRef.current
        const handleEnded = async () => {
            if (!currentTrack || currentTrackIndex.index === -1 || !items || items.length === 0) {
                if (currentTrack) {
                    await api.reportPlaybackStopped(currentTrack.Id, audio.currentTime)
                }

                return
            }

            await api.reportPlaybackStopped(currentTrack.Id, audio.currentTime)

            if (repeat === 'one') {
                setCurrentTrackIndex({ index: currentTrackIndex.index })
            } else {
                nextTrack()
            }
        }

        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('ended', handleEnded)
        }
    }, [api, currentTrack, currentTrackIndex.index, items, nextTrack, repeat])

    useEffect(() => {
        if (clearOnLogout && currentTrack) {
            api.reportPlaybackStopped(currentTrack.Id, audioRef.current.currentTime)
            setCurrentTrackIndex({ index: -1 })

            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [api, clearOnLogout, currentTrack])

    return {
        currentTrack,
        currentTrackIndex: shuffle
            ? shuffledPlaylist.current.indexOf(currentShuffledIndex.index)
            : currentTrackIndex.index,
        isPlaying,
        togglePlayPause,
        handleSeek,
        formatTime,
        volume,
        setVolume,
        playTrack: (index: number) => {
            setUserInteracted(true)
            setCurrentTrackIndex({ index })
        },
        nextTrack,
        previousTrack,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
        currentPlaylist: items,
        setCurrentPlaylist,
        loadMore,
        sessionPlayCount,
        resetSessionCount,
        playlistTitle,
        audioRef,
    }
}
