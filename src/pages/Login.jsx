import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogle = async () => {
        try {
            setError('');
            await loginWithGoogle();
            navigate('/');
        } catch (e) { setError(e.message); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(email, password, name);
            }
            navigate('/');
        } catch (e) {
            const msgs = {
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Wrong password',
                'auth/email-already-in-use': 'Email already registered',
                'auth/weak-password': 'Password should be at least 6 characters',
                'auth/invalid-email': 'Invalid email address',
            };
            setError(msgs[e.code] || e.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">🎵 SoundWave</div>
                <h1 className="login-title">{mode === 'login' ? 'Log in to SoundWave' : 'Create your account'}</h1>

                <button className="google-btn" onClick={handleGoogle}>
                    <span>G</span> Continue with Google
                </button>

                <div className="login-divider"><span>or</span></div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
                    </button>
                </form>

                <div className="login-switch">
                    {mode === 'login'
                        ? <span>Don't have an account? <button onClick={() => setMode('register')}>Sign up</button></span>
                        : <span>Already have an account? <button onClick={() => setMode('login')}>Log in</button></span>
                    }
                </div>
            </div>
        </div>
    );
}
