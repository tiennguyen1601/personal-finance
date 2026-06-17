import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Giao dịch', icon: '💳' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/statistics', label: 'Thống kê', icon: '📈' },
  { to: '/savings', label: 'Tiết kiệm', icon: '🐷' },
];

const themeLabel: Record<string, string> = { system: '🖥️ Hệ thống', light: '☀️ Sáng', dark: '🌙 Tối' };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { fullName, email, logout } = useAuthStore();
  const { theme, cycleTheme } = useThemeStore();
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
        <button className="theme-toggle" onClick={cycleTheme} title="Đổi giao diện sáng/tối">
          <span>{themeLabel[theme]}</span>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fullName}</div>
        <div style={{ fontSize: 12, color: 'var(--sidebar-muted)', marginBottom: 12 }}>{email}</div>
        <button onClick={handleLogout} className="glass-btn glass-btn-danger" style={{ fontSize: 13, padding: '6px 14px' }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
