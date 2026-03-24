import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { PRESETS, EQ_BANDS, dolbyEngine } from '../services/audioEngine';
import './Equalizer.css';

export default function Equalizer({ onClose }) {
    const { currentPreset, eqBands, applyPreset, setEqBand, dolbyEnabled, toggleDolby } = usePlayer();
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    // Spectrum visualiser
    const drawSpectrum = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const data = dolbyEngine.getAnalyserData();
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const barW = W / data.length * 2.5;
        const grad = ctx.createLinearGradient(0, H, 0, 0);
        grad.addColorStop(0, '#1db954');
        grad.addColorStop(0.5, '#0af');
        grad.addColorStop(1, '#a855f7');

        for (let i = 0; i < data.length; i++) {
            const bh = (data[i] / 255) * H;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(i * barW * 1.2, H - bh, barW, bh, 2);
            ctx.fill();
        }
        animRef.current = requestAnimationFrame(drawSpectrum);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(drawSpectrum);
        return () => cancelAnimationFrame(animRef.current);
    }, [drawSpectrum]);

    return (
        <div className="eq-overlay" onClick={onClose}>
            <div className="eq-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="eq-header">
                    <div className="eq-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#1db954', fontSize: '18px', fontWeight: 'bold' }}>SoundWave HD Audio</span>
                    </div>
                    <div className="eq-header-right">
                        <button
                            className={`dolby-toggle ${dolbyEnabled ? 'on' : 'off'}`}
                            onClick={toggleDolby}
                        >
                            {dolbyEnabled ? '✓ ON' : 'OFF'}
                        </button>
                        <button className="eq-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Spectrum Visualiser */}
                <div className="spectrum-wrap">
                    <canvas ref={canvasRef} className="spectrum-canvas" width={600} height={80} />
                    <div className="spectrum-label">Live Spectrum Analyser</div>
                </div>

                {/* Presets */}
                <div className="eq-presets">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            className={`preset-btn ${currentPreset === key ? 'active' : ''}`}
                            onClick={() => applyPreset(key)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* EQ Sliders */}
                <div className="eq-sliders">
                    {EQ_BANDS.map((freq, i) => (
                        <div key={freq} className="eq-band">
                            <span className="band-gain">
                                {eqBands[i] > 0 ? '+' : ''}{Math.round(eqBands[i])}
                            </span>
                            <input
                                type="range"
                                className="band-slider"
                                min="-12" max="12" step="0.5"
                                value={eqBands[i]}
                                orient="vertical"
                                onChange={e => setEqBand(i, parseFloat(e.target.value))}
                                style={{ '--level': `${((eqBands[i] + 12) / 24) * 100}%` }}
                            />
                            <span className="band-freq">
                                {freq >= 1000 ? `${freq / 1000}k` : freq}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Enhancement info */}
                <div className="eq-info">
                    <div className="info-chip">🔊 Multi-band Compression</div>
                    <div className="info-chip">🌐 True 3D Width & Haas Effect</div>
                    <div className="info-chip">🏛️ Convolver Room Spatialization</div>
                    <div className="info-chip">🛡 Dolby Atmos & DTS:X Simulation</div>
                </div>
            </div>
        </div>
    );
}
