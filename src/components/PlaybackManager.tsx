import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'

interface PlaybackManagerProps {
    serverUrl: string
    token: string
    userId: string
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
        handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
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

const PlaybackManager: React.FC<PlaybackManagerProps> = ({
    serverUrl,
    token,
    userId,
    initialVolume,
    updateLastPlayed,
    playlist = [],
    currentTrackIndex: initialTrackIndex = -1,
    loadMore,
    hasMore,
    children,
}) => {
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
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const shuffledPlaylist = useRef<number[]>([])
    const currentShuffledIndex = useRef<number>(-1)
    const playedIndices = useRef<Set<number>>(new Set())
    const hasRestored = useRef(false)

    useEffect(() => {
        localStorage.setItem('volume', volume.toString())
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
        if (savedLastPlayedTrack && token) {
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
                const streamUrl = `${serverUrl}/Audio/${lastPlayedTrack.Id}/universal?UserId=${userId}&api_key=${token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                audioRef.current.src = streamUrl
                audioRef.current.load()
            }
        } else if (!token) {
            setCurrentTrack(null)
            setCurrentTrackIndex(-1)
        }
        hasRestored.current = true
    }, [serverUrl, userId, token, playlist])

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
        audioRef.current = new Audio()
        audioRef.current.volume = volume

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
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    const playTrack = async (track: MediaItem, index: number) => {
        if (audioRef.current) {
            const audio = audioRef.current
            audio.pause()
            audio.currentTime = 0

            try {
                const streamUrl = `${serverUrl}/Audio/${track.Id}/universal?UserId=${userId}&api_key=${token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
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
                    const streamUrl = `${serverUrl}/Audio/${currentTrack.Id}/universal?UserId=${userId}&api_key=${token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = parseFloat(e.target.value)
            audioRef.current.currentTime = newTime
            setProgress(newTime)
        }
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === 0) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

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
