import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

export interface PlaybackManagerProps {
    initialVolume: number
    clearOnLogout?: boolean
}

// Broken name to prevent confusion with the context
export const useP__laybackManager = ({ initialVolume, clearOnLogout }: PlaybackManagerProps) => {
    const api = useJellyfinContext()
    const currentTrackIndex = useRef(Number(localStorage.getItem('currentTrackIndex')) || -1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [buffered, setBuffered] = useState(0)
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
    const currentShuffledIndex = useRef<number>(-1)
    const playedIndices = useRef<Set<number>>(new Set())
    const hasRestored = useRef(false)
    const [hasMoreState, setHasMoreState] = useState<boolean>(false)
    const [currentPlaylist, setCurrentPlaylist] = useState<MediaItem[]>(() => {
        const savedPlaylist = localStorage.getItem('currentPlaylist')
        return savedPlaylist ? JSON.parse(savedPlaylist) : []
    })
    const [loadMoreCallback, setLoadMoreCallback] = useState<() => Promise<MediaItem[] | undefined>>()
    const abortControllerRef = useRef<AbortController | null>(null)

    const currentTrack = useMemo(() => {
        return currentPlaylist[currentTrackIndex.current] || null
    }, [currentPlaylist, currentTrackIndex.current]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist))
    }, [currentPlaylist])

    // Update Media Session metadata
    const updateMediaSessionMetadata = useCallback(
        (track: MediaItem) => {
            if ('mediaSession' in navigator) {
                const songThumbnailUrl =
                    track.Id && track.ImageTags?.Primary
                        ? `${api.auth.serverUrl}/Items/${track.Id}/Images/Primary?tag=${track.ImageTags.Primary}&quality=100&fillWidth=512&fillHeight=512&format=webp&api_key=${api.auth.token}`
                        : null
                const albumThumbnailUrl =
                    track.AlbumPrimaryImageTag && track.AlbumId
                        ? `${api.auth.serverUrl}/Items/${track.AlbumId}/Images/Primary?tag=${track.AlbumPrimaryImageTag}&quality=100&fillWidth=512&fillHeight=512&format=webp&api_key=${api.auth.token}`
                        : null

                const artworkUrl = songThumbnailUrl || albumThumbnailUrl

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
        [api.auth.serverUrl, api.auth.token]
    )

    // Playback Reporting
    const reportPlaybackStart = useCallback(
        async (track: MediaItem, signal: AbortSignal) => {
            const url = `${api.auth.serverUrl}/Sessions/Playing`
            const payload = {
                ItemId: track.Id,
                PlayMethod: 'DirectStream',
                PositionTicks: 0,
                IsPaused: false,
                CanSeek: true,
                MediaSourceId: track.Id,
                AudioStreamIndex: 1,
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Emby-Token': api.auth.token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal,
                })
            } catch (error) {
                console.error('Error reporting playback start:', error)
            }
        },
        [api.auth.serverUrl, api.auth.token]
    )

    const reportPlaybackProgress = useCallback(
        async (track: MediaItem, position: number, isPaused: boolean) => {
            const url = `${api.auth.serverUrl}/Sessions/Playing/Progress`
            const payload = {
                ItemId: track.Id,
                PositionTicks: Math.floor(position * 10000000),
                IsPaused: isPaused,
                PlayMethod: 'DirectStream',
                MediaSourceId: track.Id,
                AudioStreamIndex: 1,
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Emby-Token': api.auth.token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })
            } catch (error) {
                console.error('Error reporting playback progress:', error)
            }
        },
        [api.auth.serverUrl, api.auth.token]
    )

    const reportPlaybackStopped = useCallback(
        async (track: MediaItem, position: number, signal?: AbortSignal) => {
            const url = `${api.auth.serverUrl}/Sessions/Playing/Stopped`
            const payload = {
                ItemId: track.Id,
                PositionTicks: Math.floor(position * 10000000),
                PlayMethod: 'DirectStream',
                MediaSourceId: track.Id,
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Emby-Token': api.auth.token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal,
                })
            } catch (error) {
                console.error('Error reporting playback stopped:', error)
            }
        },
        [api.auth.serverUrl, api.auth.token]
    )

    useEffect(() => {
        if (!isPlaying || !currentTrack) return

        const interval = setInterval(() => {
            reportPlaybackProgress(currentTrack, audioRef.current.currentTime, false)
        }, 10000)

        return () => clearInterval(interval)
    }, [isPlaying, currentTrack, reportPlaybackProgress])

    const playTrack = useCallback(
        async (index: number, currentPlaylist: MediaItem[]) => {
            const track = currentPlaylist[index]
            if (!track) {
                return
            }
            currentTrackIndex.current = index

            abortControllerRef.current?.abort('abort')
            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            if (audioRef.current) {
                const audio = audioRef.current
                if (currentTrack && isPlaying) {
                    await reportPlaybackStopped(currentTrack, audio.currentTime, signal)
                }
                audio.pause()
                audio.currentTime = 0

                try {
                    const streamUrl = `${api.auth.serverUrl}/Audio/${track.Id}/universal?UserId=${api.auth.userId}&api_key=${api.auth.token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                    audio.src = streamUrl
                    audio.load()

                    await new Promise<void>(resolve => {
                        const onLoadedMetadata = () => {
                            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
                            signal.removeEventListener('abort', onAbort)
                            audio.play()
                            resolve()
                        }
                        const onAbort = () => {
                            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
                            resolve()
                        }
                        signal.addEventListener('abort', onAbort)
                        audio.addEventListener('loadedmetadata', onLoadedMetadata)
                    })

                    currentTrackIndex.current = index
                    setIsPlaying(true)

                    localStorage.setItem('currentTrackIndex', index.toString())

                    if (shuffle) {
                        currentShuffledIndex.current = shuffledPlaylist.current.indexOf(index)
                    }

                    playedIndices.current.add(index)
                    updateMediaSessionMetadata(track)

                    // Report playback start to Jellyfin
                    await reportPlaybackStart(track, signal)
                } catch (error) {
                    console.error('Error playing track:', error)
                    setIsPlaying(false)
                    currentTrackIndex.current = -1
                    setProgress(0)
                    setDuration(0)
                    setBuffered(0)
                }
            }
        },
        [
            currentTrack,
            isPlaying,
            reportPlaybackStopped,
            api.auth.serverUrl,
            api.auth.userId,
            api.auth.token,
            shuffle,
            updateMediaSessionMetadata,
            reportPlaybackStart,
        ]
    )

    const togglePlayPause = useCallback(() => {
        if (audioRef.current && currentTrack) {
            const audio = audioRef.current
            if (isPlaying) {
                audio.pause()
                setIsPlaying(false)
                reportPlaybackProgress(currentTrack, audio.currentTime, true)
            } else {
                if (!audio.src) {
                    const streamUrl = `${api.auth.serverUrl}/Audio/${currentTrack.Id}/universal?UserId=${api.auth.userId}&api_key=${api.auth.token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                    audio.src = streamUrl
                    audio.load()
                }
                audio
                    .play()
                    .then(() => {
                        setIsPlaying(true)
                        reportPlaybackProgress(currentTrack, audio.currentTime, false)
                    })
                    .catch(error => {
                        console.error('Error resuming playback:', error)
                        setIsPlaying(false)
                        currentTrackIndex.current = -1
                        setProgress(0)
                        setDuration(0)
                        setBuffered(0)
                    })
            }
        }
    }, [currentTrack, isPlaying, reportPlaybackProgress, api.auth.serverUrl, api.auth.userId, api.auth.token])

    const processNextTrack = useCallback(
        (playlist: MediaItem[]) => {
            if (
                currentTrackIndex.current >= 0 &&
                currentTrackIndex.current < playlist.length &&
                playlist[currentTrackIndex.current]
            ) {
                playTrack(currentTrackIndex.current, playlist || [])
            } else {
                if (audioRef.current) {
                    audioRef.current.pause()
                }
                setIsPlaying(false)
            }
        },
        [playTrack]
    )

    const nextTrack = useCallback(async () => {
        if (!currentPlaylist || currentPlaylist.length === 0 || currentTrackIndex.current === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
            return
        }

        if (repeat === 'one') {
            // If repeat is 'one', play the same track again, no need to change index
        } else if (shuffle) {
            const nextIndex = currentShuffledIndex.current + 1
            if (nextIndex >= shuffledPlaylist.current.length) {
                if (hasMoreState && loadMoreCallback) {
                    const currentScrollPosition = window.scrollY
                    const newPlaylist = await loadMoreCallback()
                    window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })

                    currentShuffledIndex.current += 1

                    setCurrentPlaylist(newPlaylist || [])
                    processNextTrack(newPlaylist || [])
                    return
                } else if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(currentPlaylist.length).keys()]
                        .filter(i => i !== currentTrackIndex.current)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex.current !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex.current)
                    }
                    currentShuffledIndex.current = 0
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            }
        } else {
            const nextIndex = currentTrackIndex.current + 1
            if (nextIndex >= currentPlaylist.length) {
                if (hasMoreState && loadMoreCallback) {
                    const currentScrollPosition = window.scrollY
                    const newPlaylist = await loadMoreCallback()
                    window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })

                    currentTrackIndex.current += 1

                    setCurrentPlaylist(newPlaylist || [])
                    processNextTrack(newPlaylist || [])
                    return
                } else if (repeat === 'all') {
                    currentTrackIndex.current = 0
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            } else {
                currentTrackIndex.current += 1
            }
        }

        processNextTrack(currentPlaylist)
    }, [currentPlaylist, currentTrack, repeat, shuffle, processNextTrack, hasMoreState, loadMoreCallback])

    const previousTrack = useCallback(async () => {
        if (!currentPlaylist || currentPlaylist.length === 0 || currentTrackIndex.current === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
            return
        }

        if (repeat === 'one') {
            // If repeat is 'one', play the same track again, no need to change index
        } else if (shuffle) {
            const prevIndex = currentShuffledIndex.current - 1
            if (prevIndex < 0) {
                if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(currentPlaylist.length).keys()]
                        .filter(i => i !== currentTrackIndex.current)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex.current !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex.current)
                    }
                    currentShuffledIndex.current = shuffledPlaylist.current.length - 1
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            } else {
                currentShuffledIndex.current = prevIndex
            }
        } else {
            const prevIndex = currentTrackIndex.current - 1
            if (prevIndex < 0) {
                if (repeat === 'all') {
                    currentTrackIndex.current = currentPlaylist.length - 1
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            } else {
                currentTrackIndex.current = prevIndex
            }
        }

        processNextTrack(currentPlaylist)
    }, [currentPlaylist, currentTrack, repeat, shuffle, processNextTrack])

    const toggleShuffle = () => {
        setShuffle(prev => {
            const newShuffle = !prev
            if (newShuffle) {
                playedIndices.current.clear()
                shuffledPlaylist.current = [...Array(currentPlaylist.length).keys()]
                    .filter(i => i !== currentTrackIndex.current)
                    .sort(() => Math.random() - 0.5)
                if (currentTrackIndex.current !== -1) {
                    shuffledPlaylist.current.unshift(currentTrackIndex.current)
                }
                currentShuffledIndex.current = 0

                if (currentTrack && currentTrackIndex.current !== -1) {
                    playTrack(currentTrackIndex.current, currentPlaylist)
                }
            } else {
                shuffledPlaylist.current = []
                currentShuffledIndex.current = -1
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
            const newTime = parseFloat(e.target.value)
            audioRef.current.currentTime = newTime
            setProgress(newTime)
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

    // Attach progress, metadata, and error event listeners
    useEffect(() => {
        const audio = audioRef.current
        const updateProgress = () => {
            setProgress(audio.currentTime)
            setDuration(audio.duration || 0)
            const bufferedEnd = audio.buffered.length > 0 ? audio.buffered.end(audio.buffered.length - 1) : 0
            setBuffered(bufferedEnd)
        }

        const handleError = (e: Event) => {
            console.error('Audio error during playback:', e)
            setIsPlaying(false)
            currentTrackIndex.current = -1
            setProgress(0)
            setDuration(0)
            setBuffered(0)
        }

        audio.addEventListener('timeupdate', updateProgress)
        audio.addEventListener('loadedmetadata', updateProgress)
        audio.addEventListener('error', handleError)

        return () => {
            audio.pause()
            audio.removeEventListener('timeupdate', updateProgress)
            audio.removeEventListener('loadedmetadata', updateProgress)
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
        localStorage.setItem('currentTrackIndex', currentTrackIndex.toString())
    }, [currentTrackIndex])

    useEffect(() => {
        if (currentPlaylist.length > 0 && currentTrack) {
            const indexInPlaylist = currentPlaylist.findIndex(track => track.Id === currentTrack.Id)
            if (indexInPlaylist !== -1 && indexInPlaylist !== currentTrackIndex.current) {
                currentTrackIndex.current = indexInPlaylist
            }
        }
    }, [currentPlaylist, currentTrack])

    useEffect(() => {
        if (hasRestored.current) return
        hasRestored.current = true

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (api.auth.token) {
            const indexInPlaylist = Number(savedIndex)
            if (indexInPlaylist !== -1) {
                currentTrackIndex.current = indexInPlaylist
            } else if (savedIndex) {
                currentTrackIndex.current = parseInt(savedIndex, 10)
            } else {
                currentTrackIndex.current = -1
            }

            const lastPlayedTrack = currentPlaylist[currentTrackIndex.current]

            if (lastPlayedTrack) {
                if (audioRef.current) {
                    const streamUrl = `${api.auth.serverUrl}/Audio/${lastPlayedTrack.Id}/universal?UserId=${api.auth.userId}&api_key=${api.auth.token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                    audioRef.current.src = streamUrl
                    audioRef.current.load()
                }
                updateMediaSessionMetadata(lastPlayedTrack)
            }
        } else if (!api.auth.token) {
            currentTrackIndex.current = -1
        }
    }, [currentPlaylist, api.auth.token, api.auth.serverUrl, api.auth.userId, updateMediaSessionMetadata])

    useEffect(() => {
        if (shuffle && hasMoreState && loadMoreCallback) {
            const threshold = 5
            if (currentShuffledIndex.current >= shuffledPlaylist.current.length - threshold) {
                const currentScrollPosition = window.scrollY
                loadMoreCallback()
                window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })
            }
        }
    }, [currentShuffledIndex, shuffle, hasMoreState, loadMoreCallback])

    useEffect(() => {
        if (shuffle) {
            const currentTrackIndexInShuffled = shuffledPlaylist.current[currentShuffledIndex.current]
            shuffledPlaylist.current = [...Array(currentPlaylist.length).keys()]
                .filter(i => i !== currentTrackIndexInShuffled)
                .sort(() => Math.random() - 0.5)
            if (currentTrackIndexInShuffled !== undefined) {
                shuffledPlaylist.current.unshift(currentTrackIndexInShuffled)
                currentShuffledIndex.current = 0
            }
        }
    }, [currentPlaylist, shuffle])

    useEffect(() => {
        if (!audioRef.current) return

        const audio = audioRef.current
        const handleEnded = () => {
            if (!currentTrack || currentTrackIndex.current === -1 || !currentPlaylist || currentPlaylist.length === 0) {
                setIsPlaying(false)
                if (currentTrack) {
                    reportPlaybackStopped(currentTrack, audio.currentTime)
                }
                return
            }

            reportPlaybackStopped(currentTrack, audio.currentTime)
            if (repeat === 'one') {
                playTrack(currentTrackIndex.current, currentPlaylist)
            } else {
                nextTrack()
            }
        }

        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('ended', handleEnded)
        }
    }, [currentTrack, repeat, currentPlaylist, playTrack, nextTrack, reportPlaybackStopped])

    useEffect(() => {
        if (clearOnLogout && currentTrack) {
            reportPlaybackStopped(currentTrack, audioRef.current.currentTime)
            currentTrackIndex.current = -1
            setIsPlaying(false)
            setProgress(0)
            setDuration(0)
            setBuffered(0)
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [clearOnLogout, currentTrack, reportPlaybackStopped])

    return {
        currentTrack,
        currentTrackIndex,
        isPlaying,
        togglePlayPause,
        progress,
        duration,
        buffered,
        handleSeek,
        formatTime,
        volume,
        setVolume,
        playTrack: (index: number) => playTrack(index, currentPlaylist),
        nextTrack,
        previousTrack,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
        hasMoreState,
        setHasMoreState,
        currentPlaylist,
        setCurrentPlaylist,
        loadMoreCallback,
        setLoadMoreCallback,
    }
}
