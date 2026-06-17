import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      login(res.token, res.fullName, res.email);
      navigate('/');
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--page-bg)', padding: 16 }}>
      <div className="aurora" aria-hidden="true"><span className="b1" /><span className="b2" /><span className="b3" /></div>
      <div className="glass-card fade-in-up" style={{ padding: 40, width: 380, maxWidth: '90vw' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>💰 Chi Tiêu</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>Đăng nhập vào tài khoản của bạn</p>

        {error && <div style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--expense)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-strong)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="glass-input" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-strong)' }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="glass-input" />
          </div>
          <button type="submit" disabled={loading} className="glass-btn glass-btn-primary" style={{ width: '100%', padding: '11px', fontSize: 15 }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--accent)' }}>Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
