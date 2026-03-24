import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <div className="install-prompt-banner">
            <div className="install-prompt-content">
                <div className="install-icon">📲</div>
                <div className="install-text">
                    <h4>Install SoundWave</h4>
                    <p>Add to your home screen for quick access and the best experience!</p>
                </div>
            </div>
            <div className="install-prompt-actions">
                <button className="install-btn" onClick={handleInstallClick}>Install App</button>
                <button className="dismiss-btn" onClick={() => setShowPrompt(false)}>Later</button>
            </div>
        </div>
    );
}
