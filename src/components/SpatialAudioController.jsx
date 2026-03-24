import React, { useState, useEffect, useRef } from 'react';
import { dolbyEngine } from '../services/audioEngine';
import './SpatialAudioController.css';

export default function SpatialAudioController({ onClose }) {
    const [isOrbiting, setIsOrbiting] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 }); // -1 to 1 range
    const padRef = useRef(null);
    const orbitRef = useRef(null);

    // Apply the orientation to the engine whenever pos changes
    useEffect(() => {
        if (!dolbyEngine.ctx) return;
        // Map x(-1 to 1) to yaw(-180 to 180 degrees)
        // Map y(-1 to 1) to pitch(-90 to 90 degrees)
        const yaw = pos.x * 180;
        const pitch = pos.y * 90;
        dolbyEngine.setListenerOrientation(yaw, pitch);
    }, [pos]);

    // Auto-orbit animation loop
    useEffect(() => {
        let animationFrame;
        if (isOrbiting) {
            let angle = Math.atan2(pos.y, pos.x) || 0;
            const radius = Math.max(0.5, Math.sqrt(pos.x * pos.x + pos.y * pos.y)); // Maintain current distance or default to 0.5

            const animate = () => {
                angle += 0.02; // Speed of rotation
                setPos({
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                });
                animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        }
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isOrbiting]);

    const handlePointerDown = (e) => {
        if (isOrbiting) setIsOrbiting(false);
        updatePosition(e);
        document.addEventListener('pointermove', updatePosition);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const updatePosition = (e) => {
        if (!padRef.current) return;
        const rect = padRef.current.getBoundingClientRect();
        // Calculate normalized coordinates (-1 to 1)
        let nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        let ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        // Clamp to circle area roughly
        const dist = Math.sqrt(nx * nx + ny * ny);
        if (dist > 1) {
            nx /= dist;
            ny /= dist;
        }

        setPos({ x: nx, y: ny });
    };

    const handlePointerUp = () => {
        document.removeEventListener('pointermove', updatePosition);
        document.removeEventListener('pointerup', handlePointerUp);
    };

    const resetPosition = () => {
        setIsOrbiting(false);
        setPos({ x: 0, y: 0 });
    };

    // Calculate dot position percentage for CSS
    const dotLeft = `${((pos.x + 1) / 2) * 100}%`;
    const dotTop = `${((pos.y + 1) / 2) * 100}%`;

    return (
        <div className="spatial-overlay" onClick={onClose}>
            <div className="spatial-panel" onClick={(e) => e.stopPropagation()}>
                <div className="spatial-header">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Dolby_Atmos_Logo.svg" alt="Dolby Atmos" className="spatial-dolby-logo" />
                    <h2>Spatial Audio 3D Controller</h2>
                    <button className="spatial-close-btn" onClick={onClose}>✕</button>
                </div>

                <p className="spatial-desc">
                    Drag the orb around the listener's head in real-time to simulate true binaural HRTF head-tracking.
                </p>

                <div className="spatial-interactive-area">
                    <div className="spatial-pad" ref={padRef} onPointerDown={handlePointerDown}>
                        <div className="spatial-center-head">
                            <div className="spatial-nose"></div>
                        </div>
                        {/* Grid lines */}
                        <div className="spatial-grid-x"></div>
                        <div className="spatial-grid-y"></div>
                        <div className="spatial-grid-circle"></div>

                        {/* Draggable orb */}
                        <div className="spatial-orb" style={{ left: dotLeft, top: dotTop }}></div>
                    </div>
                </div>

                <div className="spatial-controls-row">
                    <button className="spatial-btn reset-btn" onClick={resetPosition}>
                        Reset Center
                    </button>
                    <button className={`spatial-btn orbit-btn ${isOrbiting ? 'active' : ''}`} onClick={() => setIsOrbiting(!isOrbiting)}>
                        {isOrbiting ? 'Stop Orbit' : 'Auto 360° Orbit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
