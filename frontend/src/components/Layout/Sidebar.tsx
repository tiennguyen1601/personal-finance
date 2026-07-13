import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Giao dịch', icon: '💳' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/statistics', label: 'Thống kê', icon: '📈' },
  { to: '/savings', label: 'Tiết kiệm', icon: '🐷' },
  { to: '/simulator', label: 'Mô phỏng', icon: '🔮' },
  { to: '/anomaly', label: 'Cảnh báo', icon: '🧠' },
  { to: '/challenges', label: 'Thử thách', icon: '🎮' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { fullName, email, logout } = useAuthStore();
  const { skin, mode, setSkin, setMode } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>💰 Chi Tiêu</div>
        <button onClick={onClose}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--sidebar-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          className="sidebar-close">✕</button>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)' }}>
        <div className="theme-switch">
          <div className="seg" role="group" aria-label="Phong cách">
            <button className={skin === 'manga' ? 'on' : ''} onClick={() => setSkin('manga')}>📖 Manga</button>
            <button className={skin === 'anime' ? 'on' : ''} onClick={() => setSkin('anime')}>✨ Anime</button>
          </div>
          <div className="seg" role="group" aria-label="Sáng tối">
            <button className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>☀️</button>
            <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>🌙</button>
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fullName}</div>
        <div style={{ fontSize: 12, color: 'var(--sidebar-muted)', marginBottom: 12 }}>{email}</div>
        <button onClick={handleLogout} className="glass-btn glass-btn-danger" style={{ fontSize: 13, padding: '6px 14px' }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
