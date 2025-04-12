import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { VirtuosoHandle } from 'react-virtuoso'
import { MediaItem } from '../api/jellyfin'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { useJellyfinContext } from '../context/JellyfinContext/JellyfinContext'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinArtistData } from '../hooks/useJellyfinArtistData'

const ArtistTracks = () => {
    const api = useJellyfinContext()
    const playback = usePlaybackContext()
    const { artistId } = useParams<{ artistId: string }>()
    const { artist, totalTrackCount } = useJellyfinArtistData(artistId!)
    const { setPageTitle } = usePageTitle()
    const virtuosoRef = useRef<VirtuosoHandle | null>(null)

    const [tracks, setTracks] = useState<MediaItem[]>([])
    const [startIndex, setStartIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const hasMore = tracks.length < (totalTrackCount || 0)

    useEffect(() => {
        if (artist) {
            setPageTitle(`${artist.Name}'s Tracks`)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    useEffect(() => {
        const fetchTracks = async () => {
            if (tracks.length > 0 || !artistId) return
            setLoading(true)
            try {
                const { Items } = await api.getArtistTracks(artistId, 0, 5)
                setTracks(Items)
                setStartIndex(5)
            } catch (err) {
                console.error('Failed to load tracks:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTracks()
    }, [api, artistId])

    const loadMore = async () => {
        if (loading || !hasMore) return
        setLoading(true)
        try {
            const { Items: newTracks } = await api.getArtistTracks(artistId!, startIndex, 40)
            if (newTracks.length > 0) {
                setTracks(prev => {
                    const existingIds = new Set(prev.map(track => track.Id))
                    const uniqueNewTracks = newTracks.filter(track => !existingIds.has(track.Id))
                    return [...prev, ...uniqueNewTracks]
                })
                setStartIndex(prev => prev + newTracks.length)
            }
        } catch (err) {
            console.error('Failed to load more tracks:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading && tracks.length === 0) {
        return <Loader />
    }

    if (!artist) {
        return <div className="error">Artist not found</div>
    }

    return (
        <div className="artist-tracks-page">
            <PlaylistTrackList
                virtuosoRef={virtuosoRef}
                tracks={tracks}
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(tracks)
                    playback.playTrack(index)
                }}
                playlist={tracks}
            />
        </div>
    )
}

export default ArtistTracks
