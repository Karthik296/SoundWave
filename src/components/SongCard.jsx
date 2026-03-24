import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { getSongImage } from '../services/saavnApi';
import './SongCard.css';

export default function SongCard({ song, queue = [], index = 0 }) {
    const { playSong, currentSong, isPlaying, addToQueue, playNextQueue } = usePlayer();
    const [showMenu, setShowMenu] = useState(false);
    const isActive = currentSong?.id === song?.id;
    const image = getSongImage(song, 'medium');
    const artistName = song?.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist';

    const handlePlay = () => playSong(song, queue, index);

    return (
        <div className={`song-card ${isActive ? 'active' : ''}`} onClick={handlePlay}>
            <div className="song-card-img">
                {image ? <img src={image} alt={song.name} loading="lazy" /> : <div className="song-img-placeholder">🎵</div>}
                <div className="song-overlay">
                    <button className="song-play-btn">
                        {isActive && isPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                        className="song-options-btn"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        title="More Options"
                    >
                        ⋮
                    </button>
                    {showMenu && (
                        <div className="song-options-menu">
                            <button onClick={(e) => { e.stopPropagation(); playNextQueue(song); setShowMenu(false); }}>
                                Play Next
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); addToQueue(song); setShowMenu(false); }}>
                                Add to Queue
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="song-card-info">
                <div className="song-card-name" title={song.name}>{song.name}</div>
                <div className="song-card-artist" title={artistName}>
                    {artistName}
                    {song.year && <span className="song-year-badge">• {song.year}</span>}
                </div>
            </div>
        </div>
    );
}
