import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import LanguagePage from './pages/LanguagePage';
import Library from './pages/Library';
import AlbumPage from './pages/AlbumPage';
import ArtistPage from './pages/ArtistPage';
import CategoryPage from './pages/CategoryPage';
import Login from './pages/Login';
import Account from './pages/Account';
import IntroScreen from './components/IntroScreen';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <BrowserRouter>
      {showIntro && <IntroScreen onComplete={() => setShowIntro(false)} />}
      <AuthProvider>
        <PlayerProvider>
          <div className="app-layout" style={{ display: showIntro ? 'none' : 'flex' }}>
            <Sidebar />
            <div className="main-area">
              <Navbar />
              <div className="page-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/language/:lang" element={<LanguagePage />} />
                  <Route path="/category/:id" element={<CategoryPage />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/album/:id" element={<AlbumPage />} />
                  <Route path="/artist/:id" element={<ArtistPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </div>
            <Player />
            <InstallPrompt />
          </div>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
