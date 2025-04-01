import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'
import { useJellyfinContext } from '../context/JellyfinContext'

interface PlaybackManagerProps {
    initialVolume: number
    updateLastPlayed: (track: MediaItem) => void
    playlist?: MediaItem[]
    currentTrackIndex?: number
    loadMore?: () => void
    hasMore?: boolean
    clearOnLogout?: boolean
    children: (props: {
        currentTrack: MediaItem | null
        currentTrackIndex: number
        isPlaying: boolean
        togglePlayPause: () => void
        progress: number
        duration: number
        buffered: number
        handleSeek: (e: ChangeEvent<HTMLInputElement>) => void
        formatTime: (seconds: number) => string
        volume: number
        setVolume: (volume: number) => void
        playTrack: (track: MediaItem, index: number) => void
        nextTrack: () => void
        previousTrack: () => void
        shuffle: boolean
        toggleShuffle: () => void
        repeat: 'off' | 'all' | 'one'
        toggleRepeat: () => void
    }) => ReactNode
}

const PlaybackManager = ({
    initialVolume,
    updateLastPlayed,
    playlist = [],
    currentTrackIndex: initialTrackIndex = -1,
    loadMore,
    hasMore,
    clearOnLogout,
    children,
}: PlaybackManagerProps) => {
    const api = useJellyfinContext()
    const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(() => {
        const savedTrack = localStorage.getItem('lastPlayedTrack')
        return savedTrack ? JSON.parse(savedTrack) : null
    })
    const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
        const savedIndex = localStorage.getItem('currentTrackIndex')
        return savedIndex ? parseInt(savedIndex, 10) : initialTrackIndex
    })
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

    // Update Media Session metadata
    const updateMediaSessionMetadata = (track: MediaItem) => {
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
    }

    const playTrack = async (track: MediaItem, index: number) => {
        if (audioRef.current) {
            const audio = audioRef.current
            audio.pause()
            audio.currentTime = 0

            try {
                const streamUrl = `${api.auth.serverUrl}/Audio/${track.Id}/universal?UserId=${api.auth.userId}&api_key=${api.auth.token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                audio.src = streamUrl
                audio.load()

                await new Promise<void>(resolve => {
                    const onLoadedMetadata = () => {
                        audio.removeEventListener('loadedmetadata', onLoadedMetadata)
                        resolve()
                    }
                    audio.addEventListener('loadedmetadata', onLoadedMetadata)
                })

                await audio.play()
                setCurrentTrack(track)
                setCurrentTrackIndex(index)
                setIsPlaying(true)
                updateLastPlayed(track)

                localStorage.setItem('lastPlayedTrack', JSON.stringify(track))
                localStorage.setItem('currentTrackIndex', index.toString())

                if (shuffle) {
                    currentShuffledIndex.current = shuffledPlaylist.current.indexOf(index)
                }

                playedIndices.current.add(index)

                updateMediaSessionMetadata(track)
            } catch (error) {
                console.error('Error playing track:', error)
                setIsPlaying(false)
                setCurrentTrack(null)
                setCurrentTrackIndex(-1)
                setProgress(0)
                setDuration(0)
                setBuffered(0)
            }
        }
    }

    const togglePlayPause = () => {
        if (audioRef.current && currentTrack) {
            const audio = audioRef.current
            if (isPlaying) {
                audio.pause()
                setIsPlaying(false)
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
                    })
                    .catch(error => {
                        console.error('Error resuming playback:', error)
                        setIsPlaying(false)
                        setCurrentTrack(null)
                        setCurrentTrackIndex(-1)
                        setProgress(0)
                        setDuration(0)
                        setBuffered(0)
                    })
            }
        }
    }

    const nextTrack = () => {
        if (!playlist || playlist.length === 0 || currentTrackIndex === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
            return
        }

        let nextIndex: number
        if (repeat === 'one') {
            nextIndex = currentTrackIndex
        } else if (shuffle) {
            currentShuffledIndex.current = currentShuffledIndex.current + 1
            if (currentShuffledIndex.current >= shuffledPlaylist.current.length) {
                if (hasMore && loadMore) {
                    const currentScrollPosition = window.scrollY
                    loadMore()
                    window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })
                    return
                } else if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(playlist.length).keys()]
                        .filter(i => i !== currentTrackIndex)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex)
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
            nextIndex = shuffledPlaylist.current[currentShuffledIndex.current]
        } else {
            nextIndex = currentTrackIndex + 1
            if (nextIndex >= playlist.length) {
                if (hasMore && loadMore) {
                    const currentScrollPosition = window.scrollY
                    loadMore()
                    window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })
                    return
                } else if (repeat === 'all') {
                    nextIndex = 0
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            }
        }

        if (nextIndex >= 0 && nextIndex < playlist.length && playlist[nextIndex]) {
            playTrack(playlist[nextIndex], nextIndex)
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
        }
    }

    const previousTrack = () => {
        if (!playlist || playlist.length === 0 || currentTrackIndex === -1 || !currentTrack) {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
            return
        }

        let prevIndex: number
        if (repeat === 'one') {
            prevIndex = currentTrackIndex
        } else if (shuffle) {
            currentShuffledIndex.current = currentShuffledIndex.current - 1
            if (currentShuffledIndex.current < 0) {
                if (repeat === 'all') {
                    playedIndices.current.clear()
                    shuffledPlaylist.current = [...Array(playlist.length).keys()]
                        .filter(i => i !== currentTrackIndex)
                        .sort(() => Math.random() - 0.5)
                    if (currentTrackIndex !== -1) {
                        shuffledPlaylist.current.unshift(currentTrackIndex)
                    }
                    currentShuffledIndex.current = shuffledPlaylist.current.length - 1
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            }
            prevIndex = shuffledPlaylist.current[currentShuffledIndex.current]
        } else {
            prevIndex = currentTrackIndex - 1
            if (prevIndex < 0) {
                if (repeat === 'all') {
                    prevIndex = playlist.length - 1
                } else {
                    if (audioRef.current) {
                        audioRef.current.pause()
                    }
                    setIsPlaying(false)
                    return
                }
            }
        }

        if (prevIndex >= 0 && prevIndex < playlist.length && playlist[prevIndex]) {
            playTrack(playlist[prevIndex], prevIndex)
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            setIsPlaying(false)
        }
    }

    const toggleShuffle = () => {
        setShuffle(prev => {
            const newShuffle = !prev
            if (newShuffle) {
                playedIndices.current.clear()
                shuffledPlaylist.current = [...Array(playlist.length).keys()]
                    .filter(i => i !== currentTrackIndex)
                    .sort(() => Math.random() - 0.5)
                if (currentTrackIndex !== -1) {
                    shuffledPlaylist.current.unshift(currentTrackIndex)
                }
                currentShuffledIndex.current = 0

                if (currentTrack && currentTrackIndex !== -1) {
                    playTrack(currentTrack, currentTrackIndex)
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
    }, [])

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
            setCurrentTrack(null)
            setCurrentTrackIndex(-1)
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
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                nextTrack()
            })

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                previousTrack()
            })

            navigator.mediaSession.setActionHandler('play', () => {
                togglePlayPause()
            })

            navigator.mediaSession.setActionHandler('pause', () => {
                togglePlayPause()
            })

            return () => {
                navigator.mediaSession.setActionHandler('nexttrack', null)
                navigator.mediaSession.setActionHandler('previoustrack', null)
                navigator.mediaSession.setActionHandler('play', null)
                navigator.mediaSession.setActionHandler('pause', null)
            }
        }
    }, [nextTrack, previousTrack, togglePlayPause])

    // Add media key hotkey listener for next/previous (for redundancy)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'MediaTrackNext') {
                event.preventDefault()
                nextTrack()
            } else if (event.key === 'MediaTrackPrevious') {
                event.preventDefault()
                previousTrack()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [nextTrack, previousTrack])

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
        if (playlist.length > 0 && currentTrack) {
            const indexInPlaylist = playlist.findIndex(track => track.Id === currentTrack.Id)
            if (indexInPlaylist !== -1 && indexInPlaylist !== currentTrackIndex) {
                setCurrentTrackIndex(indexInPlaylist)
            }
        }
    }, [playlist, currentTrack])

    useEffect(() => {
        if (hasRestored.current) return

        const savedLastPlayedTrack = localStorage.getItem('lastPlayedTrack')
        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedLastPlayedTrack && api.auth.token) {
            const lastPlayedTrack = JSON.parse(savedLastPlayedTrack)
            setCurrentTrack(lastPlayedTrack)
            const indexInPlaylist = playlist.findIndex(track => track.Id === lastPlayedTrack.Id)
            if (indexInPlaylist !== -1) {
                setCurrentTrackIndex(indexInPlaylist)
            } else if (savedIndex) {
                setCurrentTrackIndex(parseInt(savedIndex, 10))
            } else {
                setCurrentTrackIndex(-1)
            }
            if (audioRef.current) {
                const streamUrl = `${api.auth.serverUrl}/Audio/${lastPlayedTrack.Id}/universal?UserId=${api.auth.userId}&api_key=${api.auth.token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                audioRef.current.src = streamUrl
                audioRef.current.load()
            }
            updateMediaSessionMetadata(lastPlayedTrack)
        } else if (!api.auth.token) {
            setCurrentTrack(null)
            setCurrentTrackIndex(-1)
        }
        hasRestored.current = true
    }, [playlist, api.auth.token, api.auth.serverUrl, api.auth.userId])

    useEffect(() => {
        if (shuffle && hasMore && loadMore) {
            const threshold = 5
            if (currentShuffledIndex.current >= shuffledPlaylist.current.length - threshold) {
                const currentScrollPosition = window.scrollY
                loadMore()
                window.scrollTo({ top: currentScrollPosition, behavior: 'smooth' })
            }
        }
    }, [currentShuffledIndex, shuffle, hasMore, loadMore])

    useEffect(() => {
        if (shuffle) {
            const currentTrackIndexInShuffled = shuffledPlaylist.current[currentShuffledIndex.current]
            shuffledPlaylist.current = [...Array(playlist.length).keys()]
                .filter(i => i !== currentTrackIndexInShuffled)
                .sort(() => Math.random() - 0.5)
            if (currentTrackIndexInShuffled !== undefined) {
                shuffledPlaylist.current.unshift(currentTrackIndexInShuffled)
                currentShuffledIndex.current = 0
            }
        }
    }, [playlist, shuffle])

    useEffect(() => {
        if (!audioRef.current) return

        const audio = audioRef.current
        const handleEnded = () => {
            if (!currentTrack || currentTrackIndex === -1 || !playlist || playlist.length === 0) {
                setIsPlaying(false)
                return
            }

            if (repeat === 'one') {
                playTrack(currentTrack, currentTrackIndex)
            } else {
                nextTrack()
            }
        }

        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('ended', handleEnded)
        }
    }, [currentTrack, currentTrackIndex, repeat, playlist])

    useEffect(() => {
        if (clearOnLogout) {
            setCurrentTrack(null)
            setCurrentTrackIndex(-1)
            setIsPlaying(false)
            setProgress(0)
            setDuration(0)
            setBuffered(0)
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [clearOnLogout])

    return children({
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
        playTrack,
        nextTrack,
        previousTrack,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
    })
}

export default PlaybackManager
