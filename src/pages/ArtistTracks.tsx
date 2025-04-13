import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { VirtuosoHandle } from 'react-virtuoso'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { usePlaybackContext } from '../context/PlaybackContext/PlaybackContext'
import { useJellyfinArtistData } from '../hooks/useJellyfinArtistData'
import { useJellyfinArtistTracksData } from '../hooks/useJellyfinArtistTracksData'

const ArtistTracks = () => {
    const playback = usePlaybackContext()
    const { artistId } = useParams<{ artistId: string }>()
    const { artist } = useJellyfinArtistData(artistId!)
    const { allTracks, loading, error, loadMore, hasMore } = useJellyfinArtistTracksData(artistId!)
    const { setPageTitle } = usePageTitle()
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const hasPreloaded = useRef(false)
    const [isPreloading, setIsPreloading] = useState(false)

    useEffect(() => {
        if (artist) {
            setPageTitle(`${artist.Name}'s Tracks`)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    useEffect(() => {
        if (hasPreloaded.current || isPreloading) return

        const savedIndex = localStorage.getItem('currentTrackIndex')
        if (savedIndex) {
            const index = Number(savedIndex)
            if (index >= 0 && allTracks.length <= index && hasMore) {
                setIsPreloading(true)

                const loadAdditionalTracks = async () => {
                    if (allTracks.length > index || !hasMore) {
                        setIsPreloading(false)
                        hasPreloaded.current = true
                        return
                    }

                    if (loading) {
                        setTimeout(loadAdditionalTracks, 100)
                        return
                    }

                    await loadMore()
                    setTimeout(loadAdditionalTracks, 100)
                }

                loadAdditionalTracks()
            } else {
                hasPreloaded.current = true
                setIsPreloading(false)
            }
        } else {
            hasPreloaded.current = true
            setIsPreloading(false)
        }
    }, [allTracks.length, hasMore, loading, loadMore, isPreloading])

    if (loading && allTracks.length === 0) {
        return <Loader />
    }

    return (
        <div className="artist-tracks-page">
            {error && <div className="error">{error}</div>}
            <PlaylistTrackList
                virtuosoRef={virtuosoRef}
                tracks={allTracks}
                loading={loading}
                loadMore={loadMore}
                hasMore={hasMore}
                playTrack={index => {
                    playback.setCurrentPlaylist(allTracks, hasMore, loadMore)
                    playback.playTrack(index)
                }}
                playlist={allTracks}
            />
        </div>
    )
}

export default ArtistTracks
