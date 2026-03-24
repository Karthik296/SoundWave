import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSongsByLanguage, getSongsByCategory, CATEGORIES } from '../services/saavnApi';
import SongCard from '../components/SongCard';
import './LanguagePage.css';

const LANG_META = {
    hindi: { label: 'Hindi', flag: '🇮🇳', color: '#ff6b35', desc: 'Bollywood hits, folk & more' },
    telugu: { label: 'Telugu', flag: '🎵', color: '#f7931e', desc: 'Tollywood beats & classics' },
    tamil: { label: 'Tamil', flag: '🎶', color: '#e84855', desc: 'Kollywood & Carnatic melodies' },
    kannada: { label: 'Kannada', flag: '🌸', color: '#3bceac', desc: 'Sandalwood & folk rhythms' },
    malayalam: { label: 'Malayalam', flag: '🌴', color: '#0ead69', desc: 'Mollywood & devotional songs' },
    punjabi: { label: 'Punjabi', flag: '🌟', color: '#ffbe0b', desc: 'Bhangra, pop & folk' },
    english: { label: 'English', flag: '🎸', color: '#8338ec', desc: 'International pop & rock' },
    bengali: { label: 'Bengali', flag: '🎺', color: '#fb5607', desc: 'Rabindra sangit & modern' },
    marathi: { label: 'Marathi', flag: '🪘', color: '#06d6a0', desc: 'Lavani, natyasangeet & pop' },
    bhojpuri: { label: 'Bhojpuri', flag: '🎷', color: '#ef476f', desc: 'Folk, dance & celebration' },
};
// Map realistic hero images to the categories (Global Fallbacks)
const defaultHeroImages = {
    'latest': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    'top': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    'party': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60',
    'love': 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=500&auto=format&fit=crop&q=60',
    'devotional': 'https://images.unsplash.com/photo-1507676184212-d0330a156f97?w=500&auto=format&fit=crop&q=60',
    'mass': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    'sad': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=60',
    'folk': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop&q=60',
    'melody': 'https://images.unsplash.com/photo-1445985543470-41fbf5c50402?w=500&auto=format&fit=crop&q=60',
    'peppy': 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=500&auto=format&fit=crop&q=60',
};

// Language specific imagery overrides
const langHeroImages = {
    'hindi': {
        'party': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
        'love': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=60',
        'devotional': 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500&auto=format&fit=crop&q=60',
        'folk': 'https://images.unsplash.com/photo-1528645602411-ed0059b02fcb?w=500&auto=format&fit=crop&q=60',
        'mass': 'https://images.unsplash.com/photo-1533174000223-b6d3e8e12b7f?w=500&auto=format&fit=crop&q=60',
    },
    'telugu': {
        'party': 'https://images.unsplash.com/photo-1533174000223-b6d3e8e12b7f?w=500&auto=format&fit=crop&q=60',
        'love': 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&auto=format&fit=crop&q=60',
        'devotional': 'https://images.unsplash.com/photo-1600080352277-2e118ba8b6ef?w=500&auto=format&fit=crop&q=60',
        'mass': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=60',
        'melody': 'https://images.unsplash.com/photo-1445985543470-41fbf5c50402?w=500&auto=format&fit=crop&q=60',
    },
    'tamil': {
        'devotional': 'https://images.unsplash.com/photo-1590050720468-21d15d6c8e54?w=500&auto=format&fit=crop&q=60',
        'party': 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=500&auto=format&fit=crop&q=60',
        'mass': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    },
    'kannada': {
        'devotional': 'https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=500&auto=format&fit=crop&q=60',
        'party': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=60',
    },
    'malayalam': {
        'sad': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&auto=format&fit=crop&q=60',
        'devotional': 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=500&auto=format&fit=crop&q=60',
        'love': 'https://images.unsplash.com/photo-1550983377-ce62e73fbf5e?w=500&auto=format&fit=crop&q=60',
    },
    'punjabi': {
        'party': 'https://images.unsplash.com/photo-1533215160875-1a84f509e4de?w=500&auto=format&fit=crop&q=60',
        'folk': 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&auto=format&fit=crop&q=60',
        'peppy': 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=500&auto=format&fit=crop&q=60',
    },
    'english': {
        'party': 'https://images.unsplash.com/photo-1470229722913-7c090bf8c0d1?w=500&auto=format&fit=crop&q=60',
        'sad': 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9e4?w=500&auto=format&fit=crop&q=60'
    },
    'bengali': {
        'folk': 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=500&auto=format&fit=crop&q=60',
        'devotional': 'https://images.unsplash.com/photo-1557053910-d021f1d16ff6?w=500&auto=format&fit=crop&q=60'
    },
    'marathi': {
        'party': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=60',
        'devotional': 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500&auto=format&fit=crop&q=60'
    },
    'bhojpuri': {
        'party': 'https://images.unsplash.com/photo-1543791998-3507df0a7164?w=500&auto=format&fit=crop&q=60',
        'mass': 'https://images.unsplash.com/photo-1533174000223-b6d3e8e12b7f?w=500&auto=format&fit=crop&q=60',
    }
};

export default function LanguagePage() {
    const { lang } = useParams();
    const meta = LANG_META[lang] || { label: lang, flag: '🎵', color: '#1db954', desc: 'Music' };

    const [activeCategory, setActiveCategory] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadSongs = useCallback(async (cat, p, reset = false) => {
        setLoading(true);
        try {
            const results = cat === 'all'
                ? await getSongsByLanguage(lang, p, 30)
                : await getSongsByCategory(lang, cat, p, 30);
            setSongs(prev => reset ? results : [...prev, ...results]);
            setHasMore(results.length === 30);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [lang]);

    // Reset when language changes
    useEffect(() => {
        setSongs([]);
        setPage(0);
        setHasMore(true);
        setActiveCategory(null);
    }, [lang]);

    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        setSongs([]);
        setPage(0);
        setHasMore(true);
        loadSongs(catId, 0, true);
    };

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        loadSongs(activeCategory, next, false);
    };

    const activeCat = CATEGORIES.find(c => c.id === activeCategory);

    return (
        <div className="lang-page">
            {/* Language Header */}
            <div className="lang-header" style={{ '--lang-color': meta.color }}>
                <div className="lang-header-bg" />
                <div className="lang-flag">{meta.flag}</div>
                <div className="lang-header-info">
                    <div className="lang-type">Language</div>
                    <h1 className="lang-title">{meta.label}</h1>
                    <p className="lang-desc">{meta.desc}</p>
                </div>
            </div>

            {/* Main Content Area */}
            {activeCategory === null ? (
                /* Show Categories Grid */
                <div className="language-categories-section">
                    <h2 className="section-title">Explore Categories</h2>
                    <div className="category-cards-grid">
                        {CATEGORIES.map((cat, index) => {
                            // Assign colorful backgrounds to categories as fallback
                            const colors = ['#00d2ff', '#ff4b2b', '#f85032', '#8e2de2', '#4ca1af', '#f12711', '#f6d365', '#56ab2f', '#a8c0ff', '#ff9966'];
                            const color = colors[index % colors.length];

                            const defaultImage = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=60';

                            // Get image: check if language-specific image exists, else use global category image, else default.
                            const langOverrides = langHeroImages[lang] || {};
                            const imageUrl = langOverrides[cat.id] || defaultHeroImages[cat.id] || defaultImage;

                            return (
                                <div
                                    key={cat.id}
                                    className="category-feature-card"
                                    style={{ '--card-color': color }}
                                    onClick={() => handleCategoryClick(cat.id)}
                                >
                                    <img src={imageUrl} alt={cat.label} className="cat-hero-img" />
                                    <div className="cat-feature-bg" />
                                    <span className="cat-feature-icon">{cat.icon}</span>
                                    <span className="cat-feature-label">{cat.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Show Songs for Selected Category */
                <div className="lang-content">
                    {/* Section heading with Back button */}
                    <div className="cat-section-header">
                        <button className="back-to-categories-btn" onClick={() => setActiveCategory(null)}>
                            🔙 Back to Categories
                        </button>
                        <div className="cat-section-title">
                            <span className="cat-section-icon">{activeCat?.icon}</span>
                            <h2>{meta.label} — {activeCat?.label}</h2>
                        </div>
                    </div>

                    {loading && songs.length === 0 ? (
                        <div className="loading-screen">
                            <div className="loader" />
                            <p>Loading {activeCat?.label} songs...</p>
                        </div>
                    ) : (
                        <>
                            {songs.length === 0 && !loading ? (
                                <div className="loading-screen">
                                    <span style={{ fontSize: 40 }}>{activeCat?.icon}</span>
                                    <p>No songs found in this category</p>
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
            )}
        </div>
    );
}
