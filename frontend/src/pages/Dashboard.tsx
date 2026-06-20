import { useEffect, useState, type CSSProperties } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { Summary, Transaction } from '../types';
import { useCountUp } from '../hooks/useCountUp';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

function StatCard({ label, value, color, rune, ready }: { label: string; value: number; color: string; rune: string; ready: boolean }) {
  const n = useCountUp(ready ? value : 0);
  return (
    <div className="glass-card interactive stat-card" style={{ '--role': color } as CSSProperties}>
      <div className="stat-rune">{rune}</div>
      <div className="stat-tag">{label}</div>
      <div className="stat-val">
        {ready ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '…'}
      </div>
    </div>
  );
}

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

  return (
    <div>
      <h2 style={{ margin: '0 0 24px' }}>Dashboard</h2>

      <div className="dashboard-cards stagger">
        <StatCard label="Tổng thu tháng này" value={summary?.totalIncome ?? 0} color="var(--income)" rune="⚜" ready={!!summary} />
        <StatCard label="Tổng chi tháng này" value={summary?.totalExpense ?? 0} color="var(--expense)" rune="🜂" ready={!!summary} />
        <StatCard label="Đã tiết kiệm" value={summary?.totalSaved ?? 0} color="var(--saving)" rune="✦" ready={!!summary} />
        <StatCard label="Số dư" value={summary?.balance ?? 0} color="var(--balance)" rune="◈" ready={!!summary} />
      </div>

      <div className="dashboard-bottom">
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Chi tiêu 7 ngày qua</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" strokeOpacity={0.25} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => fmt(v as number)} />
              <Line type="monotone" dataKey="chi" stroke="var(--expense)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Giao dịch gần nhất</h3>
          {recent.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{t.categoryIcon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.categoryName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: t.type === 'Income' ? 'var(--income)' : 'var(--expense)' }}>
                {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>Chưa có giao dịch nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
