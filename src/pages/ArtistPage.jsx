import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtist, getArtistSongs } from '../services/saavnApi';
import SongCard from '../components/SongCard';
import './ArtistPage.css';

export default function ArtistPage() {
    const { id } = useParams();
    const [artist, setArtist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([getArtist(id), getArtistSongs(id)])
            .then(([a, s]) => { setArtist(a); setSongs(s); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page-loading"><div className="loader" /></div>;
    if (!artist) return <div className="page-loading"><p>Artist not found</p></div>;

    const cover = artist.image?.[artist.image.length - 1]?.url;

    return (
        <div className="artist-page">
            <div className="artist-header" style={{ '--cover': cover ? `url(${cover})` : 'none' }}>
                <div className="artist-header-overlay" />
                <div className="artist-header-content">
                    <div className="artist-avatar">
                        {cover ? <img src={cover} alt={artist.name} /> : <span>🎤</span>}
                    </div>
                    <div>
                        <div className="artist-verified">✓ Verified Artist</div>
                        <h1 className="artist-name">{artist.name}</h1>
                        {artist.followerCount && <p className="artist-followers">{Number(artist.followerCount).toLocaleString()} followers</p>}
                    </div>
                </div>
            </div>
            <div className="artist-content">
                <h2 className="section-title">Popular</h2>
                <div className="songs-grid">
                    {songs.map((s, i) => (
                        <SongCard key={s.id} song={s} queue={songs} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
