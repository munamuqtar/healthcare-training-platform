import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { PublicLayout } from './pages/Public';
import AuthPage from './pages/Auth';
import UserPortal from './pages/UserPortal';
import AdminPortal from './pages/AdminPortal';

function RootRouter() {
  const [user, setUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const checkUserSession = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUserSession();
    // Listen to authentication storage updates
    window.addEventListener('auth-change', checkUserSession);
    return () => {
      window.removeEventListener('auth-change', checkUserSession);
    };
  }, []);

  // Update HTML class for dark mode styling
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  // Protected Route Guards
  const UserGuard = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return <Navigate to="/auth?mode=login" replace />;
    return <>{children}</>;
  };

  const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('accessToken');
    const uStr = localStorage.getItem('user');
    const currentUser = uStr ? JSON.parse(uStr) : null;
    
    if (!token || !currentUser || currentUser.role !== 'admin') {
      return <Navigate to="/auth?mode=login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <PublicLayout 
              currentTab={currentTab} 
              setCurrentTab={setCurrentTab} 
              user={user} 
              onLogout={handleLogout}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          } 
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route 
          path="/dashboard" 
          element={
            <UserGuard>
              <UserPortal />
            </UserGuard>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <AdminGuard>
              <AdminPortal />
            </AdminGuard>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootRouter />
    </BrowserRouter>
  );
}
