import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import type { ByCategoryData, MonthlyData } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export default function Statistics() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [byCategory, setByCategory] = useState<ByCategoryData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);

  useEffect(() => {
    statisticsService.getByCategory(month, year).then(setByCategory);
  }, [month, year]);

  useEffect(() => {
    statisticsService.getMonthly(year).then(setMonthly);
  }, [year]);

  const barData = monthly.map(m => ({
    name: MONTHS[m.month - 1],
    'Thu nhập': m.income,
    'Chi tiêu': m.expense
  }));

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>Thống kê</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <select value={month} onChange={e => setMonth(+e.target.value)}
          className="glass-select">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="glass-select">
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Chi tiêu theo danh mục — Tháng {month}/{year}</h3>
          {byCategory.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Không có dữ liệu</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => `${entry.categoryIcon} ${entry.percentage}%`}
                  >
                    {byCategory.map((d, i) => <Cell key={i} fill={d.categoryColor} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                {byCategory.map(d => (
                  <div key={d.categoryId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, borderBottom: '1px solid var(--glass-border)' }}>
                    <span>{d.categoryIcon} {d.categoryName}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(d.amount)} ({d.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Thu/Chi theo tháng — {year}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: any) => fmt(v as number)} />
              <Legend />
              <Bar dataKey="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
