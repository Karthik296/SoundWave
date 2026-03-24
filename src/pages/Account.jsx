import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './Account.css';

export default function Account() {
    const { user, logout, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ likedSongs: 0 });
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStats({
                        likedSongs: data.likedSongs?.length || 0
                    });
                }
            } catch (error) {
                console.error("Error fetching user stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleEditClick = () => {
        setEditName(user.displayName || '');
        setSelectedFile(null);
        setPreviewUrl(user.photoURL || '');
        setUploadProgress(0);
        setIsEditing(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Show local preview instantly
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setUploadProgress(0);

        try {
            let finalPhotoUrl = user.photoURL;

            // Step 1: Upload image to Firebase Storage if a new file was selected
            if (selectedFile) {
                const storageRef = ref(storage, `profile_images/${user.uid}`);
                const uploadTask = uploadBytesResumable(storageRef, selectedFile);

                finalPhotoUrl = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            }

            // Step 2: Update Auth Profile & Firestore Document
            await updateUserProfile(editName, finalPhotoUrl);
            setIsEditing(false);
            setSelectedFile(null);

        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please ensure you have storage permissions set up.");
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    if (!user) return null;

    return (
        <div className="account-page">
            <div className="account-header">
                <div className="account-header-bg"></div>
                <div className="account-profile-section">
                    <div className="account-avatar-large">
                        {isEditing && previewUrl ? (
                            <img src={previewUrl} alt="Preview" />
                        ) : user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" />
                        ) : (
                            <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                        )}

                        {isEditing && (
                            <div className="upload-overlay" onClick={() => fileInputRef.current.click()}>
                                <span>📷 Change</span>
                            </div>
                        )}
                    </div>

                    <div className="account-user-info">
                        <span className="account-label">Profile</span>

                        {isEditing ? (
                            <div className="edit-profile-form">
                                <input
                                    type="text"
                                    className="edit-input"
                                    placeholder="Display Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <button className="outline-btn file-trigger-btn" onClick={() => fileInputRef.current.click()}>
                                    {selectedFile ? selectedFile.name : 'Upload from Device'}
                                </button>

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="upload-progress-bar">
                                        <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                )}

                                <div className="edit-actions">
                                    <button
                                        className="save-btn"
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Uploading...' : 'Save'}
                                    </button>
                                    <button
                                        className="cancel-btn"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="account-name">{user.displayName || 'Music Lover'}</h1>
                                <p className="account-email">{user.email}</p>
                                <button className="edit-profile-btn" onClick={handleEditClick}>Edit Profile</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="account-content">
                <h2 className="section-title">Account Overview</h2>

                <div className="account-cards-grid">
                    <div className="account-card">
                        <h3>Plan</h3>
                        <p className="highlight">Free</p>
                        <p className="subtext">You are currently on the free ad-supported plan.</p>
                        <button className="premium-btn">Upgrade to Premium</button>
                    </div>

                    <div className="account-card">
                        <h3>Your Library</h3>
                        {loading ? (
                            <div className="stats-loader"></div>
                        ) : (
                            <p className="highlight-stat">{stats.likedSongs} <span className="stat-label">Liked Songs</span></p>
                        )}
                        <p className="subtext">Songs you've saved to your personal library.</p>
                        <button className="outline-btn" onClick={() => navigate('/library')}>Go to Library</button>
                    </div>
                </div>

                <div className="account-actions">
                    <button className="logout-btn-large" onClick={handleLogout}>Log out</button>
                </div>
            </div>
        </div>
    );
}
