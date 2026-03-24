import React, { useEffect, useState } from 'react';
import './IntroScreen.css';

export default function IntroScreen({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Attempt to play intro sound
        const introAudio = new Audio('/dolby-intro.mp3');
        introAudio.volume = 0.6;

        introAudio.play().catch(err => {
            console.warn("Audio play failed:", err);
        });

        // wait for animation to finish then unmount
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 4500);

        return () => {
            clearTimeout(timer);
            introAudio.pause();
            introAudio.currentTime = 0;
        };
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className="intro-screen">
            <div className="glow-effect"></div>
            <div className="intro-content">
                <h1 className="app-brand">SoundWave</h1>
                <div className="dolby-badge">
                    <span className="dolby-text">EXPERIENCE WITH</span>
                    <img src="/dolby-logo.png" alt="Dolby Atmos" className="dolby-logo-intro" />
                </div>
            </div>
        </div>
    );
}
