import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAUpdatePrompt.css';

export default function PWAUpdatePrompt() {
    // This hook will automatically tell us when a new Service Worker is ready to take over
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
            // Periodically check for updates if the app is left open
            if (r) {
                setInterval(() => {
                    console.log('Checking for SW update...');
                    r.update();
                }, 60 * 60 * 1000); // 1 hour
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="pwa-toast">
            <div className="pwa-message">
                <span>🎉 New App Update Available!</span>
                <span className="pwa-desc">A new version of SoundWave with updated logos and features is ready. Click update to apply instantly.</span>
            </div>
            <div className="pwa-buttons">
                <button className="pwa-btn pwa-close" onClick={() => setNeedRefresh(false)}>Dismiss</button>
                <button className="pwa-btn pwa-reload" onClick={() => updateServiceWorker(true)}>Update Now</button>
            </div>
        </div>
    );
}
