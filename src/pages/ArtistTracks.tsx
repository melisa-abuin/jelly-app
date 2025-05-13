import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinArtistData } from '../hooks/Jellyfin/useJellyfinArtistData'
import { useJellyfinArtistTracksData } from '../hooks/Jellyfin/useJellyfinArtistTracksData'

const ArtistTracks = () => {
    const { artistId } = useParams<{ artistId: string }>()
    const { artist } = useJellyfinArtistData(artistId!)
    const { items: allTracks, isLoading, error } = useJellyfinArtistTracksData(artistId!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (artist) {
            setPageTitle(`${artist.Name}'s Tracks`)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    if (isLoading && allTracks.length === 0) {
        return <Loader />
    }

    return (
        <div className="artist-tracks-page">
            {error && <div className="error">{error}</div>}
            <PlaylistTrackList tracks={allTracks} isLoading={isLoading} showType="album" />
        </div>
    )
}

export default ArtistTracks
