import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongStreamUrl } from '../services/saavnApi';
import { dolbyEngine, PRESETS } from '../services/audioEngine';
import { useAuth } from './AuthContext';
import { useMediaSession } from '../hooks/useMediaSession';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [currentPreset, setCurrentPreset] = useState('dolby');
    const [eqBands, setEqBands] = useState(PRESETS.dolby.bands);
    const [dolbyEnabled, setDolbyEnabled] = useState(true);
    const engineInitRef = useRef(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    const audio = audioRef.current;

    // Init Dolby engine on first user interaction
    const initEngine = useCallback(() => {
        if (engineInitRef.current) return;
        dolbyEngine.init(audio);
        engineInitRef.current = true;
    }, [audio]);

    audio.ontimeupdate = () => setProgress(audio.currentTime);
    audio.ondurationchange = () => setDuration(audio.duration);
    audio.onended = () => playNext();
    audio.volume = volume;
    audio.crossOrigin = 'anonymous'; // required for Web Audio API

    const playSong = useCallback(async (song, songQueue = [], index = 0) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!song) return;

        if (currentSong?.id === song.id) {
            dolbyEngine.resume();
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().then(() => setIsPlaying(true)).catch(console.error);
            }
            return;
        }

        const url = getSongStreamUrl(song);
        if (!url) { console.warn('No stream URL for:', song.name); return; }

        // Init engine before first play
        initEngine();
        dolbyEngine.resume();

        audio.src = url;
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
        setCurrentSong(song);
        if (songQueue.length) { setQueue(songQueue); setQueueIndex(index); }
    }, [audio, initEngine, navigate, user, currentSong, isPlaying]);

    const togglePlayPause = useCallback(() => {
        dolbyEngine.resume();
        if (isPlaying) { audio.pause(); setIsPlaying(false); }
        else { audio.play(); setIsPlaying(true); }
    }, [audio, isPlaying]);

    const playNext = useCallback(() => {
        const next = queueIndex + 1;
        if (next < queue.length) { setQueueIndex(next); playSong(queue[next], queue, next); }
    }, [queue, queueIndex, playSong]);

    const playPrev = useCallback(() => {
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        const prev = queueIndex - 1;
        if (prev >= 0) { setQueueIndex(prev); playSong(queue[prev], queue, prev); }
    }, [audio, queue, queueIndex, playSong]);

    const seek = useCallback((time) => { audio.currentTime = time; }, [audio]);

    const changeVolume = useCallback((v) => {
        audio.volume = v;
        setVolume(v);
        dolbyEngine.setVolume(v);
    }, [audio]);

    const applyPreset = useCallback((presetKey) => {
        dolbyEngine.applyPreset(presetKey);
        setCurrentPreset(presetKey);
        setEqBands([...PRESETS[presetKey].bands]);
    }, []);

    const setEqBand = useCallback((index, gain) => {
        dolbyEngine.setBand(index, gain);
        setEqBands(prev => {
            const next = [...prev];
            next[index] = gain;
            return next;
        });
        setCurrentPreset('custom');
    }, []);

    const toggleDolby = useCallback(() => {
        const next = !dolbyEnabled;
        setDolbyEnabled(next);
        if (next) dolbyEngine.applyPreset(currentPreset);
        else dolbyEngine.applyPreset('flat');
    }, [dolbyEnabled, currentPreset]);

    const addToQueue = useCallback((song) => {
        if (!song) return;
        setQueue(prev => [...prev, song]);
    }, []);

    const playNextQueue = useCallback((song) => {
        if (!song) return;
        setQueue(prev => {
            const next = [...prev];
            next.splice(queueIndex + 1, 0, song);
            return next;
        });
    }, [queueIndex]);

    // Background playback support
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                dolbyEngine.resume();
                audio.play().catch(e => console.log('Autoplay prevented:', e));
            }
        };

        const handleBeforeUnload = () => {
            audio.pause();
        };

        // iOS Safari support
        audio.setAttribute('playsinline', '');
        audio.controls = true; // Helps with mobile policies

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [audio]);

    // MediaSession integration
    useMediaSession();

    return (
        <PlayerContext.Provider value={{
            currentSong, isPlaying, progress, duration, volume, queue, queueIndex,
            playSong, togglePlayPause, playNext, playPrev, seek, changeVolume,
            addToQueue, playNextQueue,
            currentPreset, eqBands, applyPreset, setEqBand, dolbyEnabled, toggleDolby,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() { return useContext(PlayerContext); }
