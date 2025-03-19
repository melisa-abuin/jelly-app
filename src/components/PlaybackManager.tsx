import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { MediaItem } from '../api/jellyfin'

interface PlaybackManagerProps {
    serverUrl: string
    token: string
    userId: string
    initialVolume: number
    updateLastPlayed: (track: MediaItem) => void
    children: (props: {
        currentTrack: MediaItem | null
        isPlaying: boolean
        togglePlayPause: () => void
        progress: number
        duration: number
        buffered: number
        handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
        formatTime: (seconds: number) => string
        volume: number
        setVolume: (volume: number) => void
        playTrack: (track: MediaItem) => void
    }) => ReactNode
}

const PlaybackManager: React.FC<PlaybackManagerProps> = ({
    serverUrl,
    token,
    userId,
    initialVolume,
    updateLastPlayed,
    children,
}) => {
    const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [volume, setVolume] = useState(initialVolume)
    const audioRef = useRef<HTMLAudioElement | null>(null)

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
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    useEffect(() => {
        const lastPlayedTrack = localStorage.getItem('auth')
            ? JSON.parse(localStorage.getItem('auth')!).lastPlayedTrack
            : null

        if (lastPlayedTrack && audioRef.current && token) {
            setCurrentTrack(lastPlayedTrack)
            const streamUrl = `${serverUrl}/Audio/${lastPlayedTrack.Id}/universal?UserId=${userId}&api_key=${token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
            audioRef.current.src = streamUrl
            try {
                audioRef.current.load()
            } catch (err) {
                console.error('Error loading audio on restore:', err)
                setCurrentTrack(null)
                setProgress(0)
                setDuration(0)
                setBuffered(0)
            }
        } else if (!token) {
            console.warn('No token available to restore last played track')
        }
    }, [serverUrl, userId, token])

    const playTrack = async (track: MediaItem) => {
        if (audioRef.current) {
            const audio = audioRef.current
            if (currentTrack?.Id === track.Id && isPlaying) {
                audio.pause()
                setIsPlaying(false)
                return
            }

            try {
                const streamUrl = `${serverUrl}/Audio/${track.Id}/universal?UserId=${userId}&api_key=${token}&Container=opus,webm|opus,mp3,aac,m4a|aac,m4a|alac,m4b|aac,flac,webma,webm|webma,wav,ogg&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&MaxStreamingBitrate=140000000&StartTimeTicks=0&EnableRedirection=true&EnableRemoteMedia=false`
                audio.src = streamUrl
                await audio.load()
                await audio.play()
                setCurrentTrack(track)
                setIsPlaying(true)
                updateLastPlayed(track)
            } catch (error) {
                console.error('Error playing track:', error)
                setIsPlaying(false)
                setCurrentTrack(null)
                setProgress(0)
                setDuration(0)
                setBuffered(0)
            }
        }
    }

    const togglePlayPause = () => {
        if (audioRef.current) {
            const audio = audioRef.current
            if (isPlaying) {
                audio.pause()
                setIsPlaying(false)
            } else {
                audio
                    .play()
                    .then(() => {
                        setIsPlaying(true)
                    })
                    .catch(error => {
                        console.error('Error resuming playback:', error)
                        setIsPlaying(false)
                        setCurrentTrack(null)
                        setProgress(0)
                        setDuration(0)
                        setBuffered(0)
                    })
            }
        }
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
    })
}

export default PlaybackManager
