import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
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
    </div>
  );
}
