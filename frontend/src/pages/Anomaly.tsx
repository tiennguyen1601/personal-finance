import { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { useAppStore } from '../store/appStore';
import type { Transaction, Category } from '../types';
import toast from 'react-hot-toast';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';

interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'unusual_category' | 'unusual_amount' | 'income_drop' | 'recurring_missed' | 'duplicate';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  amount?: number;
  category?: string;
  date: string;
  transactionId?: string;
  suggestion: string;
  acknowledged: boolean;
}

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  avgMonthly: number;
  currentMonthly: number;
  changePct: number;
  zScore: number;
  transactions: Transaction[];
}

export default function Anomaly() {
  const { categories } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState(6); // months
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  // Load data
  useEffect(() => {
    transactionService.getAll({}).then(txs => {
      setTransactions(txs);
      setLoading(false);
    });
  }, []);

  // Detect anomalies when data changes
  useEffect(() => {
    if (transactions.length === 0) return;
    const detected = detectAnomalies(transactions, categories, timeRange);
    setAnomalies(detected);
    setCategoryStats(computeCategoryStats(transactions, timeRange));
  }, [transactions, categories, timeRange]);

  function computeCategoryStats(txs: Transaction[], months: number): CategoryStats[] {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const recentTxs = txs.filter(t => new Date(t.date) >= cutoff && t.type === 'Expense');

    // Group by category
    const byCategory = new Map<string, { amounts: number[]; name: string; icon: string; color: string }>();
    recentTxs.forEach(t => {
      const key = t.categoryId;
      if (!byCategory.has(key)) {
        byCategory.set(key, { amounts: [], name: t.categoryName, icon: t.categoryIcon, color: t.categoryColor });
      }
      byCategory.get(key)!.amounts.push(t.amount);
    });

    // Compute monthly totals per category
    const stats: CategoryStats[] = [];
    byCategory.forEach((data, catId) => {
      // Group by month
      const monthly = new Map<string, number>();
      recentTxs
        .filter(t => t.categoryId === catId)
        .forEach(t => {
          const monthKey = t.date.slice(0, 7); // YYYY-MM
          monthly.set(monthKey, (monthly.get(monthKey) || 0) + t.amount);
        });

      const monthlyValues = Array.from(monthly.values());
      const avgMonthly = monthlyValues.length > 0
        ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
        : 0;

      // Current month
      const currentMonthKey = now.toISOString().slice(0, 7);
      const currentMonthly = monthly.get(currentMonthKey) || 0;

      const changePct = avgMonthly > 0 ? ((currentMonthly - avgMonthly) / avgMonthly) * 100 : 0;

      // Z-score
      const stdDev = monthlyValues.length > 1
        ? Math.sqrt(monthlyValues.reduce((sum, v) => sum + Math.pow(v - avgMonthly, 2), 0) / monthlyValues.length)
        : 0;
      const zScore = stdDev > 0 ? (currentMonthly - avgMonthly) / stdDev : 0;

      stats.push({
        categoryId: catId,
        categoryName: data.name,
        categoryIcon: data.icon,
        categoryColor: data.color,
        avgMonthly,
        currentMonthly,
        changePct,
        zScore,
        transactions: recentTxs.filter(t => t.categoryId === catId),
      });
    });

    return stats.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  }

  function detectAnomalies(txs: Transaction[], cats: Category[], months: number): Anomaly[] {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const recentTxs = txs.filter(t => new Date(t.date) >= cutoff);
    const anomalies: Anomaly[] = [];

    // 1. Category spending spikes (z-score > 2)
    const catStats = computeCategoryStats(txs, months);
    catStats.forEach(cat => {
      if (Math.abs(cat.zScore) > 2 && cat.currentMonthly > 0) {
        anomalies.push({
          id: `cat-spike-${cat.categoryId}-${now.toISOString().slice(0,7)}`,
          type: cat.zScore > 0 ? 'spike' : 'drop',
          severity: Math.abs(cat.zScore) > 3 ? 'high' : 'medium',
          title: cat.zScore > 0
            ? `Chi "${cat.categoryName}" tăng vọt ${cat.changePct.toFixed(0)}%`
            : `Chi "${cat.categoryName}" giảm sâu ${Math.abs(cat.changePct).toFixed(0)}%`,
          description: `TB ${months} tháng: ${fmt(cat.avgMonthly)} → Tháng này: ${fmt(cat.currentMonthly)} (Z-score: ${cat.zScore.toFixed(2)})`,
          amount: cat.currentMonthly,
          category: cat.categoryName,
          date: now.toISOString().slice(0, 10),
          suggestion: cat.zScore > 0
            ? `Xem lại các giao dịch ${cat.categoryName} tháng này. Có thể gom đơn, tự nấu, hoặc đổi thương hiệu rẻ hơn?`
            : `Chi tiêu ${cat.categoryName} giảm đáng kể. Đã thay đổi thói quen tốt?`,
          acknowledged: false,
        });
      }
    });

    // 2. Unusual single transaction amounts (amount > 3x category median)
    const expenseTxs = recentTxs.filter(t => t.type === 'Expense');
    const catMedians = new Map<string, number>();
    const catAmounts = new Map<string, number[]>();

    expenseTxs.forEach(t => {
      if (!catAmounts.has(t.categoryId)) catAmounts.set(t.categoryId, []);
      catAmounts.get(t.categoryId)!.push(t.amount);
    });

    catAmounts.forEach((amounts, catId) => {
      const sorted = amounts.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      catMedians.set(catId, sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
    });

    expenseTxs.forEach(t => {
      const median = catMedians.get(t.categoryId) || 0;
      if (median > 0 && t.amount > median * 3) {
        anomalies.push({
          id: `unusual-amount-${t.id}`,
          type: 'unusual_amount',
          severity: t.amount > median * 5 ? 'high' : 'medium',
          title: `Giao dịch bất thường: ${t.categoryName}`,
          description: `Số tiền ${fmt(t.amount)} lớn gấp ${(t.amount / median).toFixed(1)}x trung vị danh mục (${fmt(median)})`,
          amount: t.amount,
          category: t.categoryName,
          date: t.date.slice(0, 10),
          transactionId: t.id,
          suggestion: 'Kiểm tra lại số tiền. Có thể nhập nhầm số 0, hoặc đây là chi phí lớn hiếm gặp (mua sắm lớn, sửa xe, y tế)?',
          acknowledged: false,
        });
      }
    });

    // 3. Income drop detection
    const incomeTxs = recentTxs.filter(t => t.type === 'Income');
    const monthlyIncome = new Map<string, number>();
    incomeTxs.forEach(t => {
      const key = t.date.slice(0, 7);
      monthlyIncome.set(key, (monthlyIncome.get(key) || 0) + t.amount);
    });

    const incomeValues = Array.from(monthlyIncome.values());
    if (incomeValues.length >= 3) {
      const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
      const currentMonthKey = now.toISOString().slice(0, 7);
      const currentIncome = monthlyIncome.get(currentMonthKey) || 0;
      const incomeChange = avgIncome > 0 ? ((currentIncome - avgIncome) / avgIncome) * 100 : 0;

      if (incomeChange < -25 && currentIncome > 0) {
        anomalies.push({
          id: `income-drop-${currentMonthKey}`,
          type: 'income_drop',
          severity: 'high',
          title: `Thu nhập giảm ${Math.abs(incomeChange).toFixed(0)}% so với TB`,
          description: `TB ${months} tháng: ${fmt(avgIncome)} → Tháng này: ${fmt(currentIncome)}`,
          amount: currentIncome,
          date: now.toISOString().slice(0, 10),
          suggestion: 'Thu nhập giảm mạnh. Có bị mất việc, giảm ca làm, hoặc khách hàng chậm thanh toán? Cân nhắc dùng quỹ khẩn cấp.',
          acknowledged: false,
        });
      }
    }

    // 4. Potential duplicate transactions (same amount, same category, same day)
    const txByDayCat = new Map<string, Transaction[]>();
    expenseTxs.forEach(t => {
      const dupKey = `${t.date.slice(0,10)}-${t.categoryId}-${t.amount}`;
      if (!txByDayCat.has(dupKey)) txByDayCat.set(dupKey, []);
      txByDayCat.get(dupKey)!.push(t);
    });

    txByDayCat.forEach((list) => {
      if (list.length > 1) {
        list.slice(1).forEach((dup) => {
          anomalies.push({
            id: `duplicate-${dup.id}`,
            type: 'duplicate',
            severity: 'low',
            title: `Giao dịch trùng lặp khả năng cao`,
            description: `Cùng ngày, cùng danh mục "${dup.categoryName}", cùng số tiền ${fmt(dup.amount)} với giao dịch khác`,
            amount: dup.amount,
            category: dup.categoryName,
            date: dup.date.slice(0, 10),
            transactionId: dup.id,
            suggestion: 'Kiểm tra 2 giao dịch này. Có thể nhập 2 lần, hoặc thực sự chi 2 lần riêng biệt?',
            acknowledged: false,
          });
        });
      }
    });

    // 5. Missing recurring expense (category usually has monthly spend but missing this month)
    const monthlyCatExpense = new Map<string, Set<string>>(); // categoryId -> Set of monthKeys
    expenseTxs.forEach(t => {
      const key = t.date.slice(0, 7);
      if (!monthlyCatExpense.has(t.categoryId)) monthlyCatExpense.set(t.categoryId, new Set());
      monthlyCatExpense.get(t.categoryId)!.add(key);
    });

    const currentMonthKey = now.toISOString().slice(0, 7);
    const prevMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    monthlyCatExpense.forEach((monthsSet, catId) => {
      const cat = cats.find(c => c.id === catId);
      if (!cat) return;

      // If category appeared in at least 3 of last 6 months but missing this month
      const recentMonths = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return d.toISOString().slice(0, 7);
      });
      const appearances = recentMonths.filter(m => monthsSet.has(m)).length;

      if (appearances >= 3 && !monthsSet.has(currentMonthKey) && monthsSet.has(prevMonthKey)) {
        anomalies.push({
          id: `missing-recurring-${catId}-${currentMonthKey}`,
          type: 'recurring_missed',
          severity: 'low',
          title: `Chi phí định kỳ "${cat.name}" thiếu tháng này`,
          description: `Danh mục này thường xuất hiện ${appearances}/6 tháng gần đây nhưng tháng này không có giao dịch`,
          category: cat.name,
          date: now.toISOString().slice(0, 10),
          suggestion: 'Quên ghi giao dịch? Hoặc đã hủy dịch vụ/subscription này? Kiểm tra lại nhé.',
          acknowledged: false,
        });
      }
    });

    // Sort by severity then date
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return anomalies.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds(prev => new Set(prev).add(id));
    toast.success('Đã xác nhận');
  };

  const unacknowledgedAnomalies = anomalies.filter(a => !acknowledgedIds.has(a.id));
  const highSeverity = unacknowledgedAnomalies.filter(a => a.severity === 'high').length;
  const mediumSeverity = unacknowledgedAnomalies.filter(a => a.severity === 'medium').length;
  const lowSeverity = unacknowledgedAnomalies.filter(a => a.severity === 'low').length;

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang phân tích dữ liệu...
      </div>
    );
  }

  const getSeverityColor = (sev: string) =>
    sev === 'high' ? 'var(--expense)' : sev === 'medium' ? 'var(--ornament)' : 'var(--text-muted)';
  const getSeverityIcon = (sev: string) => sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '🟢';
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      spike: '📈', drop: '📉', unusual_amount: '💰',
      income_drop: '💼', recurring_missed: '🔄', duplicate: '👥', unusual_category: '🏷️',
    };
    return icons[type] || '⚠️';
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>🧠 Phát hiện bất thường (Smart Anomaly Detection)</h2>

      {/* Summary Cards */}
      <div className="dashboard-cards stagger" style={{ marginBottom: 24 }}>
        <div className="glass-card interactive stat-card" style={{ '--role': 'var(--expense)' } as React.CSSProperties}>
          <div className="stat-rune">🔴</div>
          <div className="stat-tag">Cao</div>
          <div className="stat-val" style={{ color: 'var(--expense)' }}>{highSeverity}</div>
          <div className="stat-sub">Cần hành động ngay</div>
        </div>
        <div className="glass-card interactive stat-card" style={{ '--role': 'var(--ornament)' } as React.CSSProperties}>
          <div className="stat-rune">🟡</div>
          <div className="stat-tag">Trung bình</div>
          <div className="stat-val" style={{ color: 'var(--ornament)' }}>{mediumSeverity}</div>
          <div className="stat-sub">Cần xem xét</div>
        </div>
        <div className="glass-card interactive stat-card" style={{ '--role': 'var(--text-muted)' } as React.CSSProperties}>
          <div className="stat-rune">🟢</div>
          <div className="stat-tag">Thấp</div>
          <div className="stat-val" style={{ color: 'var(--text-muted)' }}>{lowSeverity}</div>
          <div className="stat-sub">Chỉ tham khảo</div>
        </div>
        <div className="glass-card interactive stat-card" style={{ '--role': 'var(--income)' } as React.CSSProperties}>
          <div className="stat-rune">✅</div>
          <div className="stat-tag">Đã xác nhận</div>
          <div className="stat-val" style={{ color: 'var(--income)' }}>{acknowledgedIds.size}</div>
          <div className="stat-sub">Tổng số cảnh báo</div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Phân tích dữ liệu:</div>
        <select value={timeRange} onChange={e => setTimeRange(+e.target.value)} className="glass-select" style={{ width: 'auto' }}>
          <option value={3}>3 tháng gần nhất</option>
          <option value={6}>6 tháng gần nhất</option>
          <option value={12}>12 tháng gần nhất</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {transactions.length} giao dịch • {anomalies.length} cảnh báo tổng
        </div>
      </div>

      {/* Anomalies List */}
      <div className="glass-card" style={{ padding: 0 }}>
        {unacknowledgedAnomalies.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-strong)' }}>
              Không phát hiện bất thường nào!
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Chi tiêu của bạn ổn định và trong khoảng bình thường.
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16 20', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                ⚠️ {unacknowledgedAnomalies.length} cảnh báo cần chú ý
              </h3>
              <button
                onClick={() => {
                  unacknowledgedAnomalies.forEach(a => handleAcknowledge(a.id));
                }}
                className="glass-btn"
                style={{ fontSize: 12 }}
              >
                Xác nhận tất cả
              </button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {unacknowledgedAnomalies.map(anomaly => (
                <AnomalyCard
                  key={anomaly.id}
                  anomaly={anomaly}
                  onAcknowledge={handleAcknowledge}
                  severityColor={getSeverityColor(anomaly.severity)}
                  severityIcon={getSeverityIcon(anomaly.severity)}
                  typeIcon={getTypeIcon(anomaly.type)}
                />
              ))}
            </div>
          </>
        )}

        {/* Category Stats Table */}
        {categoryStats.length > 0 && (
          <div style={{ borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '16 20', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>📊 Chi tiêu theo danh mục (tháng này vs TB {timeRange} tháng)</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Danh mục', 'TB tháng', 'Tháng này', 'Thay đổi', 'Z-score', 'Trạng thái'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map(cat => (
                    <tr key={cat.categoryId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        <span style={{ marginRight: 8, fontSize: 16 }}>{cat.categoryIcon}</span>
                        {cat.categoryName}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{fmt(cat.avgMonthly)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{fmt(cat.currentMonthly)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        <span style={{ color: cat.changePct > 0 ? 'var(--expense)' : cat.changePct < 0 ? 'var(--income)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {cat.changePct >= 0 ? '+' : ''}{cat.changePct.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                        color: Math.abs(cat.zScore) > 2 ? 'var(--expense)' : Math.abs(cat.zScore) > 1 ? 'var(--ornament)' : 'var(--text-muted)' }}>
                        {cat.zScore.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        {Math.abs(cat.zScore) > 3 ? (
                          <span className="chip" style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--expense)' }}>⚠️ Rất bất thường</span>
                        ) : Math.abs(cat.zScore) > 2 ? (
                          <span className="chip" style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--ornament)' }}>⚡ Bất thường</span>
                        ) : Math.abs(cat.zScore) > 1 ? (
                          <span className="chip" style={{ background: 'rgba(168,85,247,0.2)', color: 'var(--ornament)' }}>👀 Chú ý</span>
                        ) : (
                          <span className="chip" style={{ background: 'rgba(34,197,94,0.2)', color: 'var(--income)' }}>✅ Bình thường</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnomalyCard({ anomaly, onAcknowledge, severityColor, severityIcon, typeIcon }: {
  anomaly: Anomaly;
  onAcknowledge: (id: string) => void;
  severityColor: string;
  severityIcon: string;
  typeIcon: string;
}) {
  return (
    <div style={{ padding: '16 20', borderBottom: '1px solid var(--glass-border)', borderLeft: `4px solid ${severityColor}`, background: 'var(--glass-bg-strong)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 24 }}>{typeIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{anomaly.title}</span>
            <span className="chip" style={{ fontSize: 10, background: `${severityColor}20`, color: severityColor }}>
              {severityIcon} {anomaly.severity.toUpperCase()}
            </span>
            {anomaly.category && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--glass-bg)', padding: '2 6', borderRadius: 4 }}>
                {anomaly.category}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{anomaly.description}</div>
          <div style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(139,92,246,0.1)', padding: '8 12', borderRadius: 6, display: 'inline-block', border: '1px solid rgba(139,92,246,0.3)' }}>
            💡 {anomaly.suggestion}
          </div>
          {anomaly.amount && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Số tiền liên quan: <strong style={{ color: 'var(--expense)' }}>{fmt(anomaly.amount)}</strong>
              {anomaly.transactionId && (
                <button
                  onClick={() => onAcknowledge(anomaly.id)}
                  style={{ marginLeft: 12, fontSize: 11, padding: '4 8', background: 'none', border: '1px solid var(--glass-border)', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Đã kiểm tra
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onAcknowledge(anomaly.id)}
          style={{ padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}
          title="Xác nhận đã xem"
        >
          ✓
        </button>
      </div>
    </div>
  );
}