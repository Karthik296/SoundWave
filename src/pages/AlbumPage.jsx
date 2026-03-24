import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAlbum } from '../services/saavnApi';
import { usePlayer } from '../context/PlayerContext';
import SongCard from '../components/SongCard';
import './AlbumPage.css';

export default function AlbumPage() {
    const { id } = useParams();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const { playSong } = usePlayer();

    useEffect(() => {
        // eslint-disable-next-line
        setLoading(true);
        getAlbum(id).then(setAlbum).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page-loading"><div className="loader" /></div>;
    if (!album) return <div className="page-loading"><p>Album not found</p></div>;

    const songs = album.songs || [];
    const cover = album.image?.[album.image.length - 1]?.url;

    return (
        <div className="album-page">
            <div className="album-header">
                <div className="album-cover">
                    {cover ? <img src={cover} alt={album.name} /> : <div className="cover-placeholder">💿</div>}
                </div>
                <div className="album-meta">
                    <div className="album-type">Album</div>
                    <h1 className="album-name">{album.name}</h1>
                    <p className="album-info">{album.artists?.primary?.map(a => a.name).join(', ')} • {album.year} • {songs.length} songs</p>
                    <button className="album-play-btn" onClick={() => songs[0] && playSong(songs[0], songs, 0)}>
                        ▶ Play All
                    </button>
                </div>
            </div>

            <div className="album-songs">
                <div className="song-row-header">
                    <span>#</span><span>Title</span><span>Duration</span>
                </div>
                {songs.map((song, i) => (
                    <div key={song.id} className="song-row" onClick={() => playSong(song, songs, i)}>
                        <span className="row-num">{i + 1}</span>
                        <div className="row-info">
                            <div className="row-name">{song.name}</div>
                            <div className="row-artist">{song.artists?.primary?.map(a => a.name).join(', ')}</div>
                        </div>
                        <span className="row-dur">{song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
