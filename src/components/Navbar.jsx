import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        // Use mousedown instead of click to prevent conflict with React's synthetic click events bubbling
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setShowDropdown(false);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="nav-arrow" onClick={() => navigate(-1)}>◀</button>
                <button className="nav-arrow" onClick={() => navigate(1)}>▶</button>
            </div>
            <div className="navbar-right">
                {user ? (
                    <div className="nav-user-container" ref={dropdownRef}>
                        <div
                            className="nav-user"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(prev => !prev);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="nav-avatar">
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="" />
                                    : <span>{(user.displayName || 'U')[0]}</span>
                                }
                            </div>
                            <span className="nav-username">{user.displayName || user.email}</span>
                            <span className="nav-dropdown-icon">{showDropdown ? '▲' : '▼'}</span>
                        </div>

                        {showDropdown && (
                            <div className="nav-dropdown-menu">
                                <button className="dropdown-item" onClick={() => {
                                    setShowDropdown(false);
                                    navigate('/account');
                                }}>
                                    Account Settings
                                </button>
                                <button className="dropdown-item" onClick={handleLogout}>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="nav-auth">
                        <button className="btn-outline" onClick={() => navigate('/login')}>Sign up</button>
                        <button className="btn-filled" onClick={() => navigate('/login')}>Log in</button>
                    </div>
                )}
            </div>
        </header>
    );
}
