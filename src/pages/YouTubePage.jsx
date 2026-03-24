import { useState, useCallback, useEffect } from 'react';
import { searchYouTubeVideos, getTrendingYouTubeVideos } from '../services/youtubeApi';
import './YouTubePage.css';

export default function YouTubePage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isTrending, setIsTrending] = useState(true);

    // Fetch trending on mount
    useEffect(() => {
        loadTrending();
    }, []);

    const loadTrending = async () => {
        setLoading(true);
        setError('');
        try {
            const videos = await getTrendingYouTubeVideos('IN');
            setResults(videos);
            setIsTrending(true);
        } catch (err) {
            setError(err.message || 'Failed to load trending videos. The server might be busy.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();

        // If empty query, reload trending
        if (!query.trim()) {
            loadTrending();
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setSelectedVideo(null);
        setIsTrending(false);

        try {
            const videos = await searchYouTubeVideos(query);
            setResults(videos);
        } catch (err) {
            setError(err.message || 'An error occurred while searching. The proxy might be rate-limited.');
        } finally {
            setLoading(false);
        }
    }, [query]);

    return (
        <div className="youtube-page page-container">
            <div className="youtube-header">
                <h1 className="page-title">
                    <span className="yt-icon">▶️</span> YouTube
                </h1>
                <p className="page-subtitle">Search and watch videos directly in SoundWave.</p>

                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '20px', padding: '6px 16px', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffcc00', letterSpacing: '-0.5px', border: '1px solid #ffcc00', padding: '0 4px', borderRadius: '4px' }}>Dolby VISION</span>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffcc00', fontStyle: 'italic', letterSpacing: '-0.5px' }}>HDR10+</span>
                        <span style={{ fontSize: '13px', color: '#ffcc00', fontWeight: 'bold' }}>Enhancements Active</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,150,255,0.4)', borderRadius: '20px', padding: '6px 16px', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#00bfff', letterSpacing: '-0.5px', border: '1px solid #00bfff', padding: '0 4px', borderRadius: '4px' }}>Dolby ATMOS</span>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#00bfff', fontStyle: 'italic', letterSpacing: '-0.5px' }}>DTS:X</span>
                        <span style={{ fontSize: '13px', color: '#00bfff', fontWeight: 'bold' }}>Spatial Audio Active</span>
                    </div>
                </div>

                <form className="yt-search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search for songs, artists, or videos..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="yt-search-input"
                    />
                    <button type="submit" className="yt-search-btn" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {error && <div className="error-msg">{error}</div>}

            {selectedVideo && (
                <div className="yt-player-container">
                    <div className="yt-player-header">
                        <h3>{selectedVideo.title}</h3>
                        <button className="close-player-btn" onClick={() => setSelectedVideo(null)}>✕ Close Player</button>
                    </div>
                    <div className="iframe-wrapper hdr-enhanced">
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.url.split('watch?v=')[1]}?autoplay=1&vq=hd2160&color=white&modestbranding=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {!loading && results.length > 0 && !selectedVideo && (
                <div className="yt-results-container">
                    {isTrending && <h2 className="section-title" style={{ color: 'white', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>🔥 Trending in India</h2>}
                    {!isTrending && <h2 className="section-title" style={{ color: 'white', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>Search Results</h2>}

                    <div className="yt-results-grid">
                        {results.map((vid, idx) => {
                            // Trending streams vs search streams have slightly different url patterns in piped
                            // Piped URLs in trending usually start with /watch?v=, search results use /watch?v=
                            const videoId = vid.url.includes('watch?v=') ? vid.url.split('watch?v=')[1] : null;

                            return (
                                <div key={idx} className="yt-video-card" onClick={() => setSelectedVideo(vid)}>
                                    <div className="yt-thumbnail-wrapper">
                                        <img src={vid.thumbnail} alt={vid.title} loading="lazy" />
                                        <div className="yt-duration">{vid.duration > 0 ? new Date(vid.duration * 1000).toISOString().substring(14, 19).replace(/^00:/, '') : 'Live'}</div>
                                        <div className="yt-play-overlay">▶</div>
                                    </div>
                                    <div className="yt-video-info">
                                        <h4 className="yt-video-title">{vid.title}</h4>
                                        <div className="yt-video-channel">
                                            {vid.uploaderName}
                                            <span style={{ color: '#ffcc00', fontSize: '11px', fontWeight: 'bold', marginLeft: '6px', border: '1px solid #ffcc00', padding: '1px 4px', borderRadius: '4px' }}>4K HDR</span>
                                            <span style={{ color: '#00bfff', fontSize: '11px', fontWeight: 'bold', marginLeft: '4px', border: '1px solid #00bfff', padding: '1px 4px', borderRadius: '4px' }}>ATMOS</span>
                                        </div>
                                        <div className="yt-video-stats">{vid.views > 0 ? `${(vid.views / 1000).toFixed(1)}K views` : 'Trending'} • {vid.uploadedDate || 'Recently'}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!loading && !error && results.length === 0 && !selectedVideo && query && (
                <div className="no-results">No videos found. Try a different search.</div>
            )}
        </div>
    );
}
