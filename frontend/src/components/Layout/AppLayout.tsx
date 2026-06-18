import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { isAuthenticated, authReady } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <div className="aurora" aria-hidden="true">
        <span className="b1" /><span className="b2" /><span className="b3" />
      </div>
      <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content fade-in">
        <Outlet />
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-strong)',
            borderRadius: '12px',
            boxShadow: 'var(--glass-shadow)',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: 'var(--income)', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'var(--expense)', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
