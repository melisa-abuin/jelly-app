import axios from 'axios';
import { useEffect, useState } from 'react';
import { getAllTracks, MediaItem } from '../api/jellyfin';

interface JellyfinTracksData {
    allTracks: MediaItem[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
}

export const useJellyfinTracksData = (serverUrl: string, userId: string, token: string) => {
    const [data, setData] = useState<JellyfinTracksData>({
        allTracks: [],
        loading: true,
        error: null,
        hasMore: true,
    });

    const [page, setPage] = useState(0);
    const itemsPerPage = 20;

    useEffect(() => {
        if (!serverUrl || !token) {
            setData(prev => ({ ...prev, loading: true, error: 'No serverUrl or token' }));
            return;
        }

        const fetchData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }));
            try {
                console.log(`Fetching tracks data from Jellyfin (page ${page})...`);
                const tracks = await getAllTracks(serverUrl, userId, token, page * itemsPerPage, itemsPerPage);

                setData(prev => ({
                    allTracks: [...prev.allTracks, ...tracks],
                    loading: false,
                    error: null,
                    hasMore: tracks.length === itemsPerPage, // True if full page was returned
                }));
            } catch (error) {
                console.error('Failed to fetch tracks data:', error);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('auth');
                    window.location.href = '/login';
                } else {
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to fetch tracks data' }));
                }
            }
        };

        fetchData();
    }, [serverUrl, userId, token, page]);

    const loadMore = () => {
        if (!data.loading && data.hasMore) {
            setPage(prev => prev + 1);
        }
    };

    return { ...data, loadMore };
};
