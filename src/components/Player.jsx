import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { getSongImage } from '../services/saavnApi';
import { useState, useEffect } from 'react';
import Equalizer from './Equalizer';
import SpatialAudioController from './SpatialAudioController';
import './Player.css';

import { useMediaSession } from '../hooks/useMediaSession';

function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

export default function Player() {
    useMediaSession();

    const {
        currentSong, isPlaying, progress, duration, volume, queue, queueIndex,
        togglePlayPause, playNext, playPrev, seek, changeVolume, playSong,
        dolbyEnabled, currentPreset,
    } = usePlayer();
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [showEq, setShowEq] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [showSpatial, setShowSpatial] = useState(false);

    useEffect(() => {
        if (!user || !currentSong) return;
        getDoc(doc(db, 'users', user.uid)).then(snap => {
            const songs = snap.data()?.likedSongs || [];
            setLiked(songs.some(s => s.id === currentSong.id));
        });
    }, [currentSong, user]);

    const toggleLike = async () => {
        if (!user || !currentSong) return;
        const ref = doc(db, 'users', user.uid);
        const songData = {
            id: currentSong.id,
            name: currentSong.name,
            image: getSongImage(currentSong, 'medium'),
            artist: currentSong.artists?.primary?.[0]?.name || '',
        };
        if (liked) {
            const snap = await getDoc(ref);
            const existing = snap.data()?.likedSongs || [];
            const updated = existing.filter(s => s.id !== currentSong.id);
            await setDoc(ref, { likedSongs: updated }, { merge: true });
            setLiked(false);
        } else {
            await updateDoc(ref, { likedSongs: arrayUnion(songData) });
            setLiked(true);
        }
    };

    const [isExpanded, setIsExpanded] = useState(false);

    if (!currentSong) return (
        <div className="player player--empty">
            <span>🎵 Select a song to start playing</span>
        </div>
    );

    const image = getSongImage(currentSong, 'medium');
    const artistName = currentSong.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist';
    const pct = duration ? (progress / duration) * 100 : 0;
    return (
        <>
            {showEq && <Equalizer onClose={() => setShowEq(false)} />}
            {showSpatial && <SpatialAudioController onClose={() => setShowSpatial(false)} />}

            {showQueue && (
                <div className="queue-panel">
                    <div className="queue-header">
                        <h3>Queue</h3>
                        <button className="queue-close-btn" onClick={() => setShowQueue(false)}>×</button>
                    </div>
                    <div className="queue-list">
                        {queue.map((s, idx) => (
                            <div
                                key={`q-${s.id}-${idx}`}
                                className={`queue-item ${idx === queueIndex ? 'playing' : ''}`}
                                onClick={() => playSong(s, queue, idx)}
                            >
                                <img src={getSongImage(s, 'small')} alt="" />
                                <div className="queue-item-info">
                                    <div className="queue-item-name">{s.name}</div>
                                    <div className="queue-item-artist">{s.artists?.primary?.map(a => a.name).join(', ')}</div>
                                </div>
                                {idx === queueIndex && <div className="queue-playing-icon">🎵</div>}
                            </div>
                        ))}
                        {queue.length === 0 && <div className="queue-empty">Queue is empty</div>}
                    </div>
                </div>
            )}

            <div
                className={`player ${isExpanded ? 'player--expanded' : ''} ${isPlaying ? 'playing' : ''}`}
                style={isExpanded && image ? {
                    backgroundImage: `url(${getSongImage(currentSong, 'high')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                } : {}}
            >
                {/* ── EXPANDED (FULL-SCREEN) VIEW ── */}
                {isExpanded && (
                    <>
                        <div className="player-bg-overlay" />

                        <div className="player-expanded-layout">
                            {/* Top bar: minimize */}
                            <div className="expanded-topbar">
                                <button
                                    className="minimize-btn"
                                    onClick={() => setIsExpanded(false)}
                                    title="Minimize"
                                >▼</button>
                                <span className="expanded-topbar-label">Now Playing</span>
                                <div style={{ width: 44 }} /> {/* spacer to center label */}
                            </div>

                            {/* Album Cover */}
                            <div className="expanded-cover-wrap">
                                {image
                                    ? <img
                                        src={getSongImage(currentSong, 'high')}
                                        alt={currentSong.name}
                                        className={`expanded-cover-img ${isPlaying ? 'playing' : ''}`}
                                      />
                                    : <div className="expanded-cover-placeholder">🎵</div>
                                }
                            </div>

                            {/* Song Info + Like */}
                            <div className="expanded-song-info">
                                <div className="expanded-song-text">
                                    <div className="expanded-song-name">{currentSong.name}</div>
                                    <div className="expanded-song-artist">{artistName}</div>
                                </div>
                                <button
                                    className={`like-btn exp-like ${liked ? 'liked' : ''}`}
                                    onClick={toggleLike}
                                    title={liked ? 'Unlike' : 'Like'}
                                >{liked ? '♥' : '♡'}</button>
                            </div>

                            {/* Progress Bar */}
                            <div className="expanded-progress">
                                <span className="time-label">{formatTime(progress)}</span>
                                <div
                                    className="progress-track"
                                    onClick={e => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        seek((e.clientX - rect.left) / rect.width * duration);
                                    }}
                                >
                                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                                    <div className="progress-thumb" style={{ left: `${pct}%` }} />
                                </div>
                                <span className="time-label">{formatTime(duration)}</span>
                            </div>

                            {/* Playback Controls */}
                            <div className="expanded-controls">
                                <button className="ctrl-btn" onClick={playPrev} title="Previous">⏮</button>
                                <button className="ctrl-btn play-btn" onClick={togglePlayPause}>
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                                <button className="ctrl-btn" onClick={playNext} title="Next">⏭</button>
                            </div>

                            {/* Bottom Accessory Row */}
                            <div className="expanded-accessories">
                                <button
                                    className={`queue-toggle-btn ${showQueue ? 'active' : ''}`}
                                    onClick={() => setShowQueue(!showQueue)}
                                    title="Queue"
                                >☰</button>

                                <button
                                    className={`dolby-btn ${dolbyEnabled ? 'active' : ''}`}
                                    onClick={() => setShowEq(true)}
                                    title="Dolby & DTS EQ"
                                >
                                    <img src="/dolby-logo.png" alt="Dolby" className="dolby-logo-img" />
                                </button>

                                <button
                                    className="spatial-toggle-btn"
                                    onClick={() => setShowSpatial(true)}
                                    title="3D Spatial Audio"
                                    style={{ background: 'none', border: 'none', color: '#00bfff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px', textShadow: '0 0 5px rgba(0,191,255,0.5)' }}
                                >🎧 3D</button>

                                <div className="expanded-volume">
                                    <span className="vol-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={volume}
                                        className="vol-slider"
                                        onChange={e => changeVolume(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── MINI BAR ── */}
                {!isExpanded && (
                    <div
                        className="player-main-bar"
                        onClick={(e) => {
                            if (e.target.closest('.player-center') || e.target.closest('.player-right') || e.target.closest('.like-btn')) return;
                            setIsExpanded(true);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Song Info */}
                        <div className="player-info">
                            <div className="player-img">
                                {image ? <img src={image} alt={currentSong.name} /> : <div className="player-img-placeholder">🎵</div>}
                            </div>
                            <div className="player-meta">
                                <div className="player-song-name">{currentSong.name}</div>
                                <div className="player-artist">{artistName}</div>
                            </div>
                            <button
                                className={`like-btn ${liked ? 'liked' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleLike(); }}
                                title={liked ? 'Unlike' : 'Like'}
                            >{liked ? '♥' : '♡'}</button>
                        </div>

                        {/* Center Controls */}
                        <div className="player-center">
                            <div className="player-progress">
                                <span className="time-label">{formatTime(progress)}</span>
                                <div
                                    className="progress-track"
                                    onClick={e => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        seek((e.clientX - rect.left) / rect.width * duration);
                                    }}
                                >
                                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                                    <div className="progress-thumb" style={{ left: `${pct}%` }} />
                                </div>
                                <span className="time-label">{formatTime(duration)}</span>
                            </div>
                            <div className="player-controls">
                                <button className="ctrl-btn" onClick={playPrev} title="Previous">⏮</button>
                                <button className="ctrl-btn play-btn" onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}>
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                                <button className="ctrl-btn" onClick={playNext} title="Next">⏭</button>
                            </div>
                        </div>

                        {/* Right: Volume + Dolby + Queue */}
                        <div className="player-right">
                            <button
                                className={`queue-toggle-btn ${showQueue ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setShowQueue(!showQueue); }}
                                title="Queue"
                            >☰</button>

                            <button
                                className={`dolby-btn ${dolbyEnabled ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setShowEq(true); }}
                                title="Dolby & DTS Audio Enhancement"
                            >
                                <img src="/dolby-logo.png" alt="Dolby" className="dolby-logo-img" />
                            </button>

                            <button
                                className="spatial-toggle-btn"
                                onClick={(e) => { e.stopPropagation(); setShowSpatial(true); }}
                                title="Interactive 3D Spatial Audio Controller"
                                style={{ background: 'none', border: 'none', color: '#00bfff', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px', textShadow: '0 0 5px rgba(0,191,255,0.5)' }}
                            >🎧 3D</button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="vol-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={volume}
                                    className="vol-slider"
                                    onChange={e => changeVolume(parseFloat(e.target.value))}
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
