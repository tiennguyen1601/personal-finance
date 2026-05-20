import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Giao dịch', icon: '💳' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/statistics', label: 'Thống kê', icon: '📈' },
  { to: '/savings', label: 'Tiết kiệm', icon: '🐷' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { fullName, email, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>💰 Chi Tiêu</div>
        <button onClick={onClose}
          style={{ display: 'none', background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          className="sidebar-close">✕</button>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', color: 'white', textDecoration: 'none',
              background: isActive ? '#334155' : 'transparent',
              borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent'
            })}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fullName}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{email}</div>
        <button onClick={handleLogout}
          style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6,
            padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
