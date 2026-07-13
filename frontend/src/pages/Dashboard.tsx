import { useEffect, useState, type CSSProperties, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { Summary, Transaction } from '../types';
import { useCountUp } from '../hooks/useCountUp';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

function StatCard({ label, value, color, rune, ready, subLabel, trend }: { label: string; value: number; color: string; rune: string; ready: boolean; subLabel?: string; trend?: 'up' | 'down' | 'neutral' }) {
  const n = useCountUp(ready ? value : 0);
  return (
    <div className="glass-card interactive stat-card" style={{ '--role': color } as CSSProperties}>
      <div className="stat-rune">{rune}</div>
      <div className="stat-tag">{label}</div>
      <div className="stat-val">
        {ready ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '…'}
      </div>
      {subLabel && <div className="stat-sub">{subLabel}</div>}
      {trend && <div className={`stat-trend ${trend}`}>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'}</div>}
    </div>
  );
}

// GitHub-style Spending Heatmap Component
function SpendingHeatmap({ transactions, year, selectedMonth, onMonthChange }: {
  transactions: Transaction[];
  year: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}) {
  const CELL_SIZE = 16;
  const CELL_GAP = 2;
  const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const WEEK_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Build daily expense map for the year
  const dailyExpense = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'Expense') {
        const dateStr = t.date.split('T')[0]; // YYYY-MM-DD
        map.set(dateStr, (map.get(dateStr) || 0) + t.amount);
      }
    });
    return map;
  }, [transactions]);

  // Get max expense for color intensity
  const maxExpense = useMemo(() => {
    let max = 0;
    dailyExpense.forEach(v => { if (v > max) max = v; });
    return max;
  }, [dailyExpense]);

  // Render a single month grid
  const renderMonth = (month: number, isSelected: boolean) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const weeks: (string | null)[][] = [];
    let week: (string | null)[] = Array(7).fill(null);
    let day = 1;

    // Fill first week
    for (let d = startDay; d < 7; d++) {
      if (day > daysInMonth) break;
      week[d] = String(day);
      day++;
    }
    weeks.push([...week]);

    // Fill remaining weeks
    while (day <= daysInMonth) {
      week = Array(7).fill(null);
      for (let d = 0; d < 7; d++) {
        if (day > daysInMonth) break;
        week[d] = String(day);
        day++;
      }
      weeks.push([...week]);
    }

    return (
      <div key={month} className={`heatmap-month ${isSelected ? 'selected' : ''}`} style={{ display: 'inline-block', verticalAlign: 'top', marginRight: 16 }} onClick={() => onMonthChange(month)}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--text-strong)', textAlign: 'center' }}>{MONTH_LABELS[month - 1]}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, auto)', gap: CELL_GAP }}>
          {WEEK_DAYS.map((_, i) => (
            <div key={i} style={{ width: CELL_SIZE, height: CELL_SIZE, fontSize: 7, color: 'var(--text-muted)', textAlign: 'center', lineHeight: `${CELL_SIZE}px`, fontWeight: 500 }}>{WEEK_DAYS[i]}</div>
          ))}
          {weeks.map((weekArr, w) => (
            <>
              {weekArr.map((dayStr, d) => {
                if (!dayStr) {
                  return <div key={`${w}-${d}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                }
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
                const amount = dailyExpense.get(dateStr) || 0;
                const intensity = maxExpense > 0 ? Math.min(1, amount / maxExpense) : 0;
                const opacity = 0.15 + intensity * 0.85;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={`${w}-${d}`}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: 3,
                      background: amount > 0 ? `rgba(239, 68, 68, ${opacity})` : 'var(--glass-border)',
                      cursor: 'pointer',
                      border: isToday ? '2px solid var(--accent)' : 'none',
                      boxShadow: isToday ? '0 0 0 2px var(--accent)' : 'none',
                      transition: 'transform 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: amount > 0 ? 600 : 400,
                      color: amount > 0 && intensity > 0.5 ? '#fff' : 'var(--text-muted)',
                      textShadow: amount > 0 && intensity > 0.5 ? '0 0 2px rgba(0,0,0,0.5)' : 'none',
                    }}
                    title={`${dayStr}/${month}: ${fmt(amount)}`}
                  >
                    {dayStr}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Lịch nhiệt chi tiêu {year}</h3>
        <select value={selectedMonth} onChange={e => onMonthChange(+e.target.value)} className="glass-select" style={{ width: 'auto' }}>
          {MONTH_LABELS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => renderMonth(m, m === selectedMonth))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{
            width: 14, height: 14, borderRadius: 3,
            background: v === 0 ? 'var(--glass-border)' : `rgba(239, 68, 68, ${0.15 + v * 0.85})`,
            border: '1px solid var(--glass-border)'
          }} />
        ))}
        <span>Nhiều</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>Hôm nay</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();

  // Payday = 10th of each month
  const PAYDAY = 10;

  // Calculate pay period: from 10th of current month (or previous) to 9th of next month
  const getPayPeriod = (date: Date) => {
    const d = new Date(date);
    let periodStart: Date, periodEnd: Date;

    if (d.getDate() >= PAYDAY) {
      // Current pay period: 10th this month -> 9th next month
      periodStart = new Date(d.getFullYear(), d.getMonth(), PAYDAY);
      periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, PAYDAY - 1);
    } else {
      // Current pay period: 10th last month -> 9th this month
      periodStart = new Date(d.getFullYear(), d.getMonth() - 1, PAYDAY);
      periodEnd = new Date(d.getFullYear(), d.getMonth(), PAYDAY - 1);
    }
    return { periodStart, periodEnd };
  };

  const { periodStart, periodEnd } = getPayPeriod(now);
  const daysInPayPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsedInPayPeriod = Math.max(0, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysLeftInPayPeriod = Math.max(0, daysInPayPeriod - daysElapsedInPayPeriod + 1);

  const [monthSummary, setMonthSummary] = useState<Summary | null>(null);
  const [allTimeSummary, setAllTimeSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<{ label: string; chi: number }[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [heatmapMonth, setHeatmapMonth] = useState(currentMonth);
  const { setCategories } = useAppStore();

  useEffect(() => {
    statisticsService.getSummaryByMonth(currentMonth, currentYear).then(setMonthSummary);
    statisticsService.getSummary().then(setAllTimeSummary);
    transactionService.getAll({ month: currentMonth, year: currentYear }).then(data => setRecent(data.slice(0, 5)));
    categoryService.getAll().then(setCategories);

    // Chart data: expense for last 7 days
    transactionService.getAll({ month: currentMonth, year: currentYear, type: 'Expense' }).then(data => {
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

    // Load ALL transactions for heatmap
    transactionService.getAll({}).then(setAllTransactions);
  }, [currentMonth, currentYear]);

  // Filter transactions for current pay period
  const payPeriodTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= periodStart && d <= periodEnd;
    });
  }, [allTransactions, periodStart, periodEnd]);

  const payPeriodExpense = payPeriodTransactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const payPeriodIncome = payPeriodTransactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);

  // Using monthSummary.totalSaved as proxy for this pay period
  const payPeriodRemaining = payPeriodIncome - payPeriodExpense - (monthSummary?.totalSaved ?? 0);

  // Special features calculations (adjusted for payday)
  const payPeriodDailyLimit = daysLeftInPayPeriod > 0
    ? payPeriodRemaining / daysLeftInPayPeriod
    : 0;

  const savingsRate = monthSummary && monthSummary.totalIncome > 0
    ? ((monthSummary.totalIncome - monthSummary.totalExpense - monthSummary.totalSaved) / monthSummary.totalIncome) * 100
    : 0;

  const avgDailyExpense = monthSummary && dayOfMonth > 0
    ? monthSummary.totalExpense / dayOfMonth
    : 0;

  const payPeriodAvgDaily = payPeriodExpense > 0 && daysElapsedInPayPeriod > 0
    ? payPeriodExpense / daysElapsedInPayPeriod
    : 0;

  return (
    <div>
      <h2 style={{ margin: '0 0 24px' }}>Dashboard</h2>

      <div className="dashboard-cards stagger">
        <StatCard label="Tổng thu tháng này" value={monthSummary?.totalIncome ?? 0} color="var(--income)" rune="⚜" ready={!!monthSummary} />
        <StatCard label="Tổng chi tháng này" value={monthSummary?.totalExpense ?? 0} color="var(--expense)" rune="🜂" ready={!!monthSummary} />
        <StatCard label="Đã tiết kiệm" value={monthSummary?.totalSaved ?? 0} color="var(--saving)" rune="✦" ready={!!monthSummary} />
        <StatCard
          label="Số dư (cả năm)"
          value={allTimeSummary?.balance ?? 0}
          color="var(--balance)"
          rune="◈"
          ready={!!allTimeSummary}
          subLabel="Tổng thu - Tổng chi - Tổng tiết kiệm"
        />
      </div>

      {/* Smart Money Insights - Payday Adjusted */}
      <div className="dashboard-insights stagger" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-card interactive" style={{ padding: 20, position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--income)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kỳ lương: {periodStart.getDate()}/{periodStart.getMonth()+1} → {periodEnd.getDate()}/{periodEnd.getMonth()+1}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Còn lại: <strong>{daysLeftInPayPeriod} ngày</strong> trong kỳ</div>
          <div className="stat-val" style={{ color: payPeriodDailyLimit >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {fmt(Math.max(0, payPeriodDailyLimit))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Hạn mức chi/ngày (kỳ lương)</div>
          <div className="insight-bar" style={{ marginTop: 12, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (payPeriodDailyLimit / (payPeriodIncome || 1)) * 100))}%`, height: '100%', background: payPeriodDailyLimit >= 0 ? 'var(--income)' : 'var(--expense)', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: 20, borderLeft: '4px solid var(--expense)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TB chi/ngày (kỳ lương)</div>
          <div className="stat-val" style={{ color: 'var(--expense)' }}>
            {fmt(payPeriodAvgDaily)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Dựa trên {daysElapsedInPayPeriod} ngày trong kỳ lương</div>
        </div>

        <div className="glass-card interactive" style={{ padding: 20, borderLeft: '4px solid var(--saving)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tỷ lệ tiết kiệm</div>
          <div className="stat-val" style={{ color: savingsRate >= 20 ? 'var(--saving)' : savingsRate >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {savingsRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {savingsRate >= 20 ? '🏆 Xuất sắc!' : savingsRate >= 10 ? '👍 Khá tốt' : savingsRate >= 0 ? '⚠️ Cần cải thiện' : '🔴 Vượt ngân sách'}
          </div>
          <div className="insight-bar" style={{ marginTop: 12, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, height: '100%', background: savingsRate >= 20 ? 'var(--saving)' : savingsRate >= 0 ? 'var(--income)' : 'var(--expense)', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: 20, borderLeft: '4px solid var(--text-muted)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TB chi/ngày (tháng)</div>
          <div className="stat-val" style={{ color: 'var(--expense)' }}>
            {fmt(avgDailyExpense)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Dựa trên {dayOfMonth} ngày tháng</div>
        </div>
      </div>

      {/* Spending Heatmap */}
      <SpendingHeatmap
        transactions={allTransactions}
        year={currentYear}
        selectedMonth={heatmapMonth}
        onMonthChange={setHeatmapMonth}
      />

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