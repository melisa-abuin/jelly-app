import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Loader from '../components/Loader'
import PlaylistTrackList from '../components/PlaylistTrackList'
import { usePageTitle } from '../context/PageTitleContext/PageTitleContext'
import { useJellyfinArtistData } from '../hooks/useJellyfinArtistData'
import { useJellyfinArtistTracksData } from '../hooks/useJellyfinArtistTracksData'

const ArtistTracks = () => {
    const { artistId } = useParams<{ artistId: string }>()
    const { artist } = useJellyfinArtistData(artistId!)
    const { items: allTracks, loading, error } = useJellyfinArtistTracksData(artistId!)
    const { setPageTitle } = usePageTitle()

    useEffect(() => {
        if (artist) {
            setPageTitle(`${artist.Name}'s Tracks`)
        }
        return () => {
            setPageTitle('')
        }
    }, [artist, setPageTitle])

    if (loading && allTracks.length === 0) {
        return <Loader />
    }

    return (
        <div className="artist-tracks-page">
            {error && <div className="error">{error}</div>}
            <PlaylistTrackList tracks={allTracks} showType="album" />
        </div>
    )
}

export default ArtistTracks
