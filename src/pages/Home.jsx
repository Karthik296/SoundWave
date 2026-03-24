import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongsByLanguage, getNewReleases, getSongImage, CATEGORIES } from '../services/saavnApi';
import SongCard from '../components/SongCard';
import { usePlayer } from '../context/PlayerContext';
import './Home.css';

const ROWS = [
    { id: 'hindi', label: '🔥 Trending Hindi', emoji: '🎵' },
    { id: 'telugu', label: '⭐ Telugu Hits', emoji: '🎶' },
    { id: 'tamil', label: '🌟 Tamil Top', emoji: '🎸' },
    { id: 'english', label: '🎸 International', emoji: '🌍' },
    { id: 'punjabi', label: '💫 Punjabi Beats', emoji: '🥁' },
];

const CATEGORY_COLORS = {
    latest: '#00d2ff', love: '#ff4b2b', mass: '#f85032',
    party: '#8e2de2', sad: '#4ca1af', devotional: '#f12711',
    top: '#f6d365', folk: '#56ab2f', melody: '#a8c0ff', peppy: '#ff9966'
};

export default function Home() {
    const [newReleases, setNewReleases] = useState([]);
    const [rows, setRows] = useState({});
    const [loading, setLoading] = useState(true);
    const { playSong } = usePlayer();
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const [nr, ...langSongs] = await Promise.all([
                    getNewReleases(),
                    ...ROWS.map(r => getSongsByLanguage(r.id, 0, 12)),
                ]);
                setNewReleases(nr);
                const rowMap = {};
                ROWS.forEach((r, i) => { rowMap[r.id] = langSongs[i]; });
                setRows(rowMap);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const featured = newReleases[0];
    const featuredBg = featured ? getSongImage(featured, 'high') : null;

    if (loading) return <div className="loading-screen"><div className="loader" /><p>Loading your music...</p></div>;

    return (
        <div className="home-page">
            {/* Hero Banner */}
            {featured && (
                <div
                    className="hero-banner"
                    style={{ '--hero-bg': `url(${featuredBg})` }}
                >
                    <div className="hero-overlay" />
                    <div className="hero-content">
                        <div className="hero-tag">🆕 New Release</div>
                        <h1 className="hero-title">{featured.name}</h1>
                        <p className="hero-artist">
                            {featured.artists?.primary?.map(a => a.name).join(', ')}
                        </p>
                        <button className="hero-play-btn" onClick={() => playSong(featured, newReleases, 0)}>
                            ▶ Play Now
                        </button>
                    </div>
                </div>
            )}

            {/* Music Rows */}
            <div className="home-sections">
                {/* Categories Row */}
                <section className="music-section">
                    <h2 className="section-title">📂 Browse by Category</h2>
                    <div className="category-cards-grid">
                        {CATEGORIES.map(cat => (
                            <div
                                key={cat.id}
                                className="category-feature-card"
                                style={{ '--card-color': CATEGORY_COLORS[cat.id] || '#1db954' }}
                                onClick={() => navigate(`/category/${cat.id}`)}
                            >
                                <div className="cat-feature-bg" />
                                <span className="cat-feature-icon">{cat.icon}</span>
                                <span className="cat-feature-label">{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* New Releases Row */}
                <section className="music-section">
                    <h2 className="section-title">✨ New Releases</h2>
                    <div className="songs-grid">
                        {newReleases.slice(0, 8).map((s, i) => (
                            <SongCard key={s.id} song={s} queue={newReleases} index={i} />
                        ))}
                    </div>
                </section>

                {/* Language rows */}
                {ROWS.map(row => (
                    <section key={row.id} className="music-section">
                        <h2 className="section-title">{row.label}</h2>
                        <div className="songs-scroll">
                            {(rows[row.id] || []).map((s, i) => (
                                <SongCard key={s.id} song={s} queue={rows[row.id] || []} index={i} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
