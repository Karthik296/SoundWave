import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSongsByCategory, CATEGORIES } from '../services/saavnApi';
import SongCard from '../components/SongCard';
import './CategoryPage.css';

const CATEGORY_COLORS = {
    latest: '#00d2ff',
    love: '#ff4b2b',
    mass: '#f85032',
    party: '#8e2de2',
    sad: '#4ca1af',
    devotional: '#f12711',
    top: '#f6d365',
    folk: '#56ab2f',
    melody: '#a8c0ff',
    peppy: '#ff9966'
};

export default function CategoryPage() {
    const { id } = useParams();
    const category = CATEGORIES.find(c => c.id === id) || { id, label: id, icon: '🎵', keyword: id };
    const color = CATEGORY_COLORS[id] || '#1db954';

    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadSongs = useCallback(async (p, reset = false) => {
        setLoading(true);
        try {
            const results = await getSongsByCategory('', category.id, p, 30);
            setSongs(prev => reset ? results : [...prev, ...results]);
            setHasMore(results.length === 30);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [category.id]);

    useEffect(() => {
        setSongs([]);
        setPage(0);
        setHasMore(true);
        loadSongs(0, true);
    }, [category.id, loadSongs]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        loadSongs(next, false);
    };

    return (
        <div className="category-page">
            <div className="category-header" style={{ '--cat-color': color }}>
                <div className="category-header-bg" />
                <div className="category-icon">{category.icon}</div>
                <div className="category-header-info">
                    <div className="category-type">Playlist</div>
                    <h1 className="category-title">{category.label}</h1>
                    <p className="category-desc">Best {category.label.toLowerCase()} songs for you</p>
                </div>
            </div>

            <div className="category-content">
                {loading && songs.length === 0 ? (
                    <div className="loading-screen">
                        <div className="loader" />
                        <p>Loading {category.label} songs...</p>
                    </div>
                ) : (
                    <>
                        {songs.length === 0 && !loading ? (
                            <div className="loading-screen">
                                <span style={{ fontSize: 40 }}>{category.icon}</span>
                                <p>No songs found for this category</p>
                            </div>
                        ) : (
                            <div className="songs-grid">
                                {songs.map((s, i) => (
                                    <SongCard key={`${s.id}-${i}`} song={s} queue={songs} index={i} />
                                ))}
                            </div>
                        )}

                        {hasMore && !loading && songs.length > 0 && (
                            <button className="load-more-btn" onClick={loadMore}>Load More</button>
                        )}
                        {loading && songs.length > 0 && (
                            <div className="loading-screen"><div className="loader" /></div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
