import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // create user doc if first time
                const ref = doc(db, 'users', firebaseUser.uid);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                    await setDoc(ref, {
                        displayName: firebaseUser.displayName || 'Music Fan',
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL || null,
                        likedSongs: [],
                        playlists: [],
                        createdAt: serverTimestamp(),
                    });
                }
                setUser(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

    const loginWithEmail = (email, password) =>
        signInWithEmailAndPassword(auth, email, password);

    const registerWithEmail = async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        return cred;
    };

    const updateUserProfile = async (displayName, photoURL) => {
        if (!auth.currentUser) throw new Error("No user logged in");

        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, {
            displayName: displayName || auth.currentUser.displayName,
            photoURL: photoURL !== undefined ? photoURL : auth.currentUser.photoURL
        });

        // Update Firestore document too
        const ref = doc(db, 'users', auth.currentUser.uid);
        await setDoc(ref, {
            displayName: displayName || auth.currentUser.displayName,
            photoURL: photoURL !== undefined ? photoURL : auth.currentUser.photoURL
        }, { merge: true });

        // Update local state to reflect changes immediately
        setUser({ ...auth.currentUser });
    };

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{
            user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateUserProfile
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
