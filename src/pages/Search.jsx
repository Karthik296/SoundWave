import { useState, useEffect, useCallback } from 'react';
import { searchSongs, searchAlbums, searchArtists } from '../services/saavnApi';
import SongCard from '../components/SongCard';
import { useNavigate } from 'react-router-dom';
import './Search.css';

const TABS = ['Songs', 'Albums', 'Artists'];

export default function Search() {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('Songs');
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const doSearch = useCallback(async (q) => {
        if (!q.trim()) { setSongs([]); setAlbums([]); setArtists([]); return; }
        setLoading(true);
        try {
            const [s, al, ar] = await Promise.all([
                searchSongs(q, 0, 30),
                searchAlbums(q, 0, 20),
                searchArtists(q, 0, 20),
            ]);
            setSongs(s);
            setAlbums(al);
            setArtists(ar);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => doSearch(query), 400);
        return () => clearTimeout(t);
    }, [query, doSearch]);

    const hasResults = songs.length || albums.length || artists.length;

    return (
        <div className="search-page">
            <div className="search-header">
                <h1 className="search-heading">Search</h1>
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={query}
                        autoFocus
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
                </div>
            </div>

            {!query && !hasResults && (
                <div className="search-browse">
                    <h2>Browse Categories</h2>
                    <div className="browse-grid">
                        {['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Punjabi', 'English', 'Bengali', 'Marathi', 'Bhojpuri'].map((lang, i) => (
                            <div key={lang} className="browse-card" style={{ '--card-hue': `${i * 36}deg` }}
                                onClick={() => navigate(`/language/${lang.toLowerCase()}`)}>
                                <span className="browse-emoji">🎵</span>
                                <span className="browse-label">{lang}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {query && (
                <div className="search-results">
                    <div className="tabs">
                        {TABS.map(t => (
                            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
                        ))}
                    </div>

                    {loading && <div className="loading-screen"><div className="loader" /></div>}

                    {!loading && tab === 'Songs' && (
                        <div className="songs-grid-result">
                            {songs.map((s, i) => <SongCard key={s.id} song={s} queue={songs} index={i} />)}
                            {!songs.length && <p className="no-results">No songs found for "{query}"</p>}
                        </div>
                    )}

                    {!loading && tab === 'Albums' && (
                        <div className="album-grid">
                            {albums.map(al => (
                                <div key={al.id} className="album-card" onClick={() => navigate(`/album/${al.id}`)}>
                                    <div className="album-card-img">
                                        {al.image?.[al.image.length - 1]?.url
                                            ? <img src={al.image[al.image.length - 1].url} alt={al.name} loading="lazy" />
                                            : <div className="song-img-placeholder">💿</div>}
                                    </div>
                                    <div className="album-card-name">{al.name}</div>
                                    <div className="album-card-year">{al.year}</div>
                                </div>
                            ))}
                            {!albums.length && <p className="no-results">No albums found</p>}
                        </div>
                    )}

                    {!loading && tab === 'Artists' && (
                        <div className="artist-grid">
                            {artists.map(ar => (
                                <div key={ar.id} className="artist-card" onClick={() => navigate(`/artist/${ar.id}`)}>
                                    <div className="artist-img">
                                        {ar.image?.[ar.image.length - 1]?.url
                                            ? <img src={ar.image[ar.image.length - 1].url} alt={ar.name} loading="lazy" />
                                            : <div className="song-img-placeholder">🎤</div>}
                                    </div>
                                    <div className="artist-card-name">{ar.name}</div>
                                    <div className="artist-card-type">Artist</div>
                                </div>
                            ))}
                            {!artists.length && <p className="no-results">No artists found</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
