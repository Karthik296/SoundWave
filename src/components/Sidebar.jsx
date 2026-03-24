import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const LANGUAGES = [
    { id: 'hindi', label: 'Hindi', flag: '🇮🇳', color: '#ff6b35' },
    { id: 'telugu', label: 'Telugu', flag: '🎵', color: '#f7c59f' },
    { id: 'tamil', label: 'Tamil', flag: '🎶', color: '#e84855' },
    { id: 'kannada', label: 'Kannada', flag: '🌸', color: '#3bceac' },
    { id: 'malayalam', label: 'Malayalam', flag: '🌴', color: '#0ead69' },
    { id: 'punjabi', label: 'Punjabi', flag: '🌟', color: '#ffbe0b' },
    { id: 'english', label: 'English', flag: '🎸', color: '#8338ec' },
    { id: 'bengali', label: 'Bengali', flag: '🎺', color: '#fb5607' },
    { id: 'marathi', label: 'Marathi', flag: '🪘', color: '#06d6a0' },
    { id: 'bhojpuri', label: 'Bhojpuri', flag: '🎷', color: '#ef476f' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <aside className="sidebar">
            <div className="sidebar-top-panel">
                <div className="sidebar-logo">
                    <span className="logo-icon">🎵</span>
                    <span className="logo-text">SoundWave</span>
                    <img src="/dolby-logo.png" alt="Dolby" className="sidebar-dolby-logo" />
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏠</span> <span className="nav-label">Home</span>
                    </NavLink>
                    <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🔍</span> <span className="nav-label">Search</span>
                    </NavLink>
                </nav>
            </div>

            <div className="sidebar-bottom-panel">
                <nav className="sidebar-nav lib-nav">
                    <NavLink to="/library" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📚</span> <span className="nav-label">Your Library</span>
                    </NavLink>
                </nav>

                <div className="sidebar-section-title">Languages</div>
                <div className="language-list">
                    {LANGUAGES.map(lang => (
                        <NavLink
                            key={lang.id}
                            to={`/language/${lang.id}`}
                            className={({ isActive }) => `lang-item ${isActive ? 'active' : ''}`}
                            style={{ '--lang-color': lang.color }}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-bottom">
                    {user ? (
                        <div className="user-info">
                            <div className="user-avatar">
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="avatar" />
                                    : <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                }
                            </div>
                            <div className="user-name">{user.displayName || user.email}</div>
                            <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
                        </div>
                    ) : (
                        <button className="login-btn" onClick={() => navigate('/login')}>
                            Log In
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar ONLY */}
            <nav className="mobile-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🏠</span> <span>Home</span>
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🔍</span> <span>Search</span>
                </NavLink>
                <NavLink to="/library" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📚</span> <span>Library</span>
                </NavLink>
            </nav>
        </aside>
    );
}
