import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { Summary, Transaction } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function Dashboard() {
  const now = new Date();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<{ label: string; chi: number }[]>([]);
  const { setCategories } = useAppStore();

  useEffect(() => {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    statisticsService.getSummary(month, year).then(setSummary);
    transactionService.getAll({ month, year }).then(data => setRecent(data.slice(0, 5)));
    categoryService.getAll().then(setCategories);

    // Chart data: expense for last 7 days
    transactionService.getAll({ month, year, type: 'Expense' }).then(data => {
      const days: { label: string; chi: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const chi = data
          .filter(t => new Date(t.date).toDateString() === d.toDateString())
          .reduce((s, t) => s + t.amount, 0);
        days.push({ label, chi });
      }
      setChartData(days);
    });
  }, []);

  const cardStyle = (color: string): React.CSSProperties => ({
    background: 'white', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>Dashboard</h2>

      <div className="dashboard-cards">
        <div style={cardStyle('#22c55e')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng thu tháng này</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{summary ? fmt(summary.totalIncome) : '...'}</div>
        </div>
        <div style={cardStyle('#ef4444')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng chi tháng này</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{summary ? fmt(summary.totalExpense) : '...'}</div>
        </div>
        <div style={cardStyle('#3b82f6')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Số dư</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{summary ? fmt(summary.balance) : '...'}</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Chi tiêu 7 ngày qua</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => fmt(v as number)} />
              <Line type="monotone" dataKey="chi" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Giao dịch gần nhất</h3>
          {recent.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{t.categoryIcon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.categoryName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(t.date).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: t.type === 'Income' ? '#16a34a' : '#dc2626' }}>
                {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>Chưa có giao dịch nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
