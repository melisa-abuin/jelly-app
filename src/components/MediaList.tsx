import React, { Component } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MediaItem } from '../api/jellyfin';
import Loader from './Loader';

// Extend MediaItem interface locally if needed
interface ExtendedMediaItem extends MediaItem {
    AlbumId?: string;
    AlbumPrimaryImageTag?: string;
}

interface MediaListProps {
    items: MediaItem[];
    type: 'song' | 'album';
    loading: boolean;
    serverUrl: string;
    loadMore?: () => void;
    hasMore?: boolean;
}

interface MediaListState {
    currentAudio: HTMLAudioElement | null;
    sizeMap: { [index: number]: number };
}

class MediaList extends Component<MediaListProps, MediaListState> {
    private rowRefs: React.RefObject<HTMLLIElement | null>[] = [];
    private resizeObservers: ResizeObserver[] = [];

    constructor(props: MediaListProps) {
        super(props);
        this.state = {
            currentAudio: null,
            sizeMap: {},
        };
        this.updateRowRefs();
    }

    componentDidMount() {
        this.measureInitialHeights();
        this.setupResizeObservers();
        document.body.style.overflowY = 'auto';
        window.addEventListener('resize', this.handleResize);
    }

    componentDidUpdate(prevProps: MediaListProps) {
        if (prevProps.items !== this.props.items) {
            this.cleanupResizeObservers();
            this.updateRowRefs();
            this.measureInitialHeights();
            this.setupResizeObservers();
        }
    }

    componentWillUnmount() {
        this.cleanupResizeObservers();
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        this.measureInitialHeights();
    };

    updateRowRefs = () => {
        this.rowRefs = this.props.items.map(() => React.createRef<HTMLLIElement>());
    };

    setupResizeObservers = () => {
        this.resizeObservers = this.rowRefs.map((ref, index) => {
            const observer = new ResizeObserver(entries => {
                if (ref.current) {
                    // Measure natural height without constraint
                    const originalHeight = ref.current.style.height;
                    ref.current.style.height = 'auto';
                    const height = ref.current.getBoundingClientRect().height;
                    ref.current.style.height = originalHeight || `${height}px`; // Restore or set height
                    if (height !== this.state.sizeMap[index]) {
                        this.setSize(index, height);
                    }
                }
            });
            if (ref.current) observer.observe(ref.current);
            return observer;
        });
    };

    cleanupResizeObservers = () => {
        this.resizeObservers.forEach(observer => observer.disconnect());
        this.resizeObservers = [];
    };

    measureInitialHeights = () => {
        this.rowRefs.forEach((ref, index) => {
            if (ref.current) {
                // Measure natural height without constraint
                const originalHeight = ref.current.style.height;
                ref.current.style.height = 'auto';
                const height = ref.current.getBoundingClientRect().height;
                ref.current.style.height = originalHeight || `${height}px`; // Restore or set height
                if (height !== this.state.sizeMap[index]) {
                    this.setSize(index, height);
                }
            }
        });
    };

    setSize = (index: number, height: number) => {
        this.setState(prevState => ({
            sizeMap: { ...prevState.sizeMap, [index]: height },
        }));
    };

    playTrack = (item: MediaItem) => {
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.setState({ currentAudio: null });
        }

        if (item.Type === 'Audio') {
            const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).token : '';
            const audioUrl = `${this.props.serverUrl}/Audio/${item.Id}/stream?api_key=${token}&format=flac`;

            const audio = new Audio(audioUrl);
            audio.play().catch(err => {
                console.error('Failed to play audio:', err);
            });
            this.setState({ currentAudio: audio });
        }
    };

    renderItem = (index: number) => {
        const item = this.props.items[index] as ExtendedMediaItem;
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).token : '';
        const imageUrl = item.ImageTags?.Primary
            ? `${this.props.serverUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&fillWidth=128&fillHeight=128&format=webp&api_key=${token}`
            : item.AlbumPrimaryImageTag && item.AlbumId
            ? `${this.props.serverUrl}/Items/${item.AlbumId}/Images/Primary?tag=${item.AlbumPrimaryImageTag}&quality=90&fillWidth=128&fillHeight=128&format=webp&api_key=${token}`
            : '/default-thumbnail.png';

        console.log(`Item ${item.Name} - Image URL: ${imageUrl}, Full Item:`, item);

        return (
            <li
                ref={this.rowRefs[index]}
                className="media-item"
                onClick={() => this.playTrack(item)}
                key={`${item.Id}-${index}`}
            >
                <div className="media-state">
                    <img
                        src={imageUrl}
                        alt={item.Name}
                        className="thumbnail"
                        onError={e => console.error(`Image load failed for ${item.Name}:`, e, 'URL:', imageUrl)}
                    />
                    <div className="overlay">
                        <div className="container">
                            <div className="play">
                                <div className="play-icon"></div>
                            </div>
                            <div className="pause">
                                <div className="pause-icon"></div>
                            </div>
                        </div>
                        <div className="play-state-animation">
                            <svg width="28" height="20" viewBox="0 0 28 20" className="sound-bars">
                                <rect
                                    x="2"
                                    y="12"
                                    width="2"
                                    height="8"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar1"
                                ></rect>
                                <rect
                                    x="6"
                                    y="10"
                                    width="2"
                                    height="10"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar2"
                                ></rect>
                                <rect
                                    x="10"
                                    y="14"
                                    width="2"
                                    height="6"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar3"
                                ></rect>
                                <rect
                                    x="14"
                                    y="11"
                                    width="2"
                                    height="9"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar4"
                                ></rect>
                                <rect
                                    x="18"
                                    y="13"
                                    width="2"
                                    height="7"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar5"
                                ></rect>
                                <rect
                                    x="22"
                                    y="12"
                                    width="2"
                                    height="8"
                                    rx="1"
                                    fill="#ffffff"
                                    className="bar bar6"
                                ></rect>
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="media-details">
                    <span className="song-name">{item.Name}</span>
                    <div className="container">
                        <div className="artist">
                            {this.props.type === 'song'
                                ? item.Artists && item.Artists.length > 0
                                    ? item.Artists.join(', ')
                                    : 'Unknown Artist'
                                : item.AlbumArtist || 'Unknown Artist'}
                        </div>
                        {this.props.type === 'song' && (
                            <>
                                <div className="divider"></div>
                                <div className="album">{item.Album || 'Unknown Album'}</div>
                            </>
                        )}
                    </div>
                </div>
            </li>
        );
    };

    render() {
        const { items, type, loading, hasMore, loadMore } = this.props;

        if (loading && items.length === 0) {
            return <Loader />;
        }

        if (items.length === 0) {
            return <div className="empty">{type === 'song' ? 'No tracks' : 'No albums'}</div>;
        }

        return (
            <ul className="media-list noSelect">
                <Virtuoso
                    useWindowScroll
                    totalCount={items.length}
                    itemContent={this.renderItem}
                    endReached={hasMore ? loadMore : undefined}
                    overscan={400}
                    increaseViewportBy={400}
                />
            </ul>
        );
    }
}

export default MediaList;
