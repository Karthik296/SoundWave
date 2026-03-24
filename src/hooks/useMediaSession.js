import { usePlayer } from '../context/PlayerContext';
import { useEffect, useCallback } from 'react';
import { getSongImage } from '../services/saavnApi';

export function useMediaSession() {
  const player = usePlayer();
  if (!player) return;

  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrev,
    queue,
    queueIndex
  } = player;

  const updateMediaSessionMetadata = useCallback(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name,
        artist: currentSong.artists?.primary?.map(a => a.name).join(', ') || 'Unknown',
        album: currentSong.album?.name || '',
        artwork: [
          { src: getSongImage(currentSong, 'small'), sizes: '96x96', type: 'image/png' },
          { src: getSongImage(currentSong, 'medium'), sizes: '128x128', type: 'image/png' },
          { src: getSongImage(currentSong, 'high'), sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', togglePlayPause);
      navigator.mediaSession.setActionHandler('pause', togglePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);

      // Update playback state
      if (isPlaying) {
        navigator.mediaSession.playbackState = 'playing';
      } else {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [currentSong, isPlaying, togglePlayPause, playNext, playPrev]);

  useEffect(() => {
    updateMediaSessionMetadata();
  }, [currentSong, isPlaying, updateMediaSessionMetadata]);

  // Handle app becoming visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);
}

