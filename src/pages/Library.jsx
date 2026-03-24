import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import './Library.css';

export default function Library() {
    const { user } = useAuth();
    const { playSong } = usePlayer();
    const [likedSongs, setLikedSongs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid);
        const unsub = onSnapshot(ref, snap => {
            const data = snap.data();
            setLikedSongs(data?.likedSongs || []);
        });
        return unsub;
    }, [user]);

    if (!user) return (
        <div className="library-page">
            <div className="library-empty">
                <div className="library-empty-icon">📚</div>
                <h2>Your Library</h2>
                <p>Log in to see your liked songs and playlists</p>
                <button className="login-cta" onClick={() => navigate('/login')}>Log In</button>
            </div>
        </div>
    );

    return (
        <div className="library-page">
            <div className="library-header">
                <h1>Your Library</h1>
                <p>{likedSongs.length} liked songs</p>
            </div>
            {likedSongs.length === 0 ? (
                <div className="library-empty">
                    <div className="library-empty-icon">♡</div>
                    <h2>Songs you like will appear here</h2>
                    <p>Save songs by pressing the heart icon while playing</p>
                </div>
            ) : (
                <div className="liked-list">
                    {likedSongs.map((song, i) => (
                        <div key={song.id} className="liked-row" onClick={() => playSong(song, likedSongs, i)}>
                            <div className="liked-num">{i + 1}</div>
                            <div className="liked-img">
                                {song.image ? <img src={song.image} alt={song.name} /> : <span>🎵</span>}
                            </div>
                            <div className="liked-info">
                                <div className="liked-name">{song.name}</div>
                                <div className="liked-artist">{song.artist}</div>
                            </div>
                            <div className="liked-heart">♥</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
