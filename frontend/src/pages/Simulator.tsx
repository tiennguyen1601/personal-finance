import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { transactionService } from '../services/transactionService';
import { savingsService } from '../services/savingsService';
import { useAppStore } from '../store/appStore';
import type { Transaction, SavingsGoal } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
const fmtCompact = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
};

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  adjustments: {
    incomeChange?: number; // percentage
    expenseChanges?: Record<string, number>; // categoryId -> percentage
    newExpense?: { name: string; amount: number; months: number }; // e.g., loan
    savingsRate?: number; // percentage of income to save
    investmentReturn?: number; // annual %
  };
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'reduce-food',
    name: 'Giảm chi ăn uống',
    icon: '🍽️',
    description: 'Giảm 20% chi tiêu ăn uống, cà phê, delivery',
    adjustments: { expenseChanges: {} }, // will be filled dynamically
  },
  {
    id: 'salary-raise',
    name: 'Tăng lương 10%',
    icon: '💼',
    description: 'Thăng chức/nhận lương mới +10%',
    adjustments: { incomeChange: 10 },
  },
  {
    id: 'buy-car',
    name: 'Mua xe trả góp',
    icon: '🚗',
    description: 'Mua xe 800Tr, trả góp 5 năm, lãi 8%/năm',
    adjustments: {
      newExpense: { name: 'Trả góp xe', amount: 16200000, months: 60 }, // ~1.62M/tháng
    },
  },
  {
    id: 'buy-house',
    name: 'Mua nhà/Đất',
    icon: '🏠',
    description: 'Trả trước 30%, vay 70% 20 năm lãi 9.5%',
    adjustments: {
      newExpense: { name: 'Trả góp nhà', amount: 45000000, months: 240 }, // ~4.5M/tháng
    },
  },
  {
    id: 'invest-sip',
    name: 'Đầu tư định kỳ (DCA)',
    icon: '📈',
    description: 'Đầu tư 20% thu nhập vào ETF/Vàng, lợi nhuận 12%/năm',
    adjustments: { savingsRate: 20, investmentReturn: 12 },
  },
  {
    id: 'emergency-fund',
    name: 'Xây dựng quỹ khẩn cấp',
    icon: '🛡️',
    description: 'Tiết kiệm 6 tháng chi tiêu trong 12 tháng',
    adjustments: { savingsRate: 30 },
  },
  {
    id: 'no-spend',
    name: 'Tháng không chi tiêu',
    icon: '🚫',
    description: 'Chỉ chi thiết yếu (ăn, ở, đi lại) trong 1 tháng',
    adjustments: { expenseChanges: {} },
  },
];

export default function Simulator() {
  const { categories } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(12); // months
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [customAdjustments, setCustomAdjustments] = useState<Scenario['adjustments']>({});
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Base calculations from real data
  const baseMetrics = useMemo(() => {
    if (transactions.length === 0) return null;

    const recentMonths = 6;
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - recentMonths, 1);

    const recentTxs = transactions.filter(t => new Date(t.date) >= cutoff);

    const monthlyIncome = recentTxs
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0) / recentMonths;

    const monthlyExpense = recentTxs
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0) / recentMonths;

    const categoryExpense: Record<string, { amount: number; name: string; icon: string }> = {};
    recentTxs
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        if (!categoryExpense[t.categoryId]) {
          categoryExpense[t.categoryId] = { amount: 0, name: t.categoryName, icon: t.categoryIcon };
        }
        categoryExpense[t.categoryId].amount += t.amount;
      });

    // Monthly averages
    Object.keys(categoryExpense).forEach(catId => {
      categoryExpense[catId].amount /= recentMonths;
    });

    const currentSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
    const monthlySavings = savingsGoals.reduce((s, g) => {
      // Estimate monthly contribution from goals
      return s + (g.targetAmount ? g.targetAmount / 12 : 0);
    }, 0);

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
      monthlySavings,
      currentSavings,
      categoryExpense,
      savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0,
    };
  }, [transactions, savingsGoals]);

  // Load data
  useEffect(() => {
    Promise.all([
      transactionService.getAll({}),
      savingsService.getAll(),
    ]).then(([txs, goals]) => {
      setTransactions(txs);
      setSavingsGoals(goals);
      setLoading(false);
    });
  }, []);

  // Run simulation when inputs change
  useEffect(() => {
    if (!baseMetrics) return;

    const scenario = selectedScenario || { adjustments: customAdjustments, id: 'custom', name: 'Tùy chỉnh', icon: '✏️', description: '' };
    const result = runSimulation(baseMetrics, scenario, horizon);
    setSimulationResult(result);
  }, [baseMetrics, selectedScenario, customAdjustments, horizon]);

  // Fill in months
  function runSimulation(base: BaseMetrics, scenario: Scenario, months: number): SimulationResult {
    const {
      monthlyIncome: baseIncome,
      monthlyExpense: baseExpense,
      monthlySavings: baseSavings,
      currentSavings,
      categoryExpense,
    } = base;

    // Apply scenario adjustments
    let income = baseIncome * (1 + (scenario.adjustments.incomeChange || 0) / 100);
    let expense = baseExpense;

    // Category-specific expense changes
    if (scenario.adjustments.expenseChanges) {
      Object.entries(scenario.adjustments.expenseChanges).forEach(([catId, pct]) => {
        if (categoryExpense[catId]) {
          expense += categoryExpense[catId].amount * (pct / 100);
        }
      });
    }

    // New recurring expense (loan, etc.)
    if (scenario.adjustments.newExpense) {
      expense += scenario.adjustments.newExpense.amount / 12; // monthly
    }

    // Savings rate adjustment
    let savingsRate = base.savingsRate;
    if (scenario.adjustments.savingsRate) {
      savingsRate = scenario.adjustments.savingsRate;
    }

    let monthlyInvestment = 0;
    if (scenario.adjustments.savingsRate) {
      monthlyInvestment = income * (scenario.adjustments.savingsRate / 100);
    } else if (scenario.adjustments.investmentReturn) {
      monthlyInvestment = baseSavings;
    }

    const monthlyReturn = scenario.adjustments.investmentReturn
      ? Math.pow(1 + scenario.adjustments.investmentReturn / 100, 1 / 12) - 1
      : 0;

    // Monte Carlo: 3 paths (pessimistic, expected, optimistic)
    const volatility = 0.15; // 15% annual vol for investments
    const monthlyVol = volatility / Math.sqrt(12);

    const paths = ['pessimistic', 'expected', 'optimistic'] as const;
    const projections = paths.map(pathType => {
      let savings = currentSavings;
      let invested = 0;
      const monthlyData: MonthlyProjection[] = [];

      for (let m = 1; m <= months; m++) {
        const netCashflow = income - expense;

        // Random return for this month (different per path)
        let returnRate = monthlyReturn;
        if (monthlyReturn > 0) {
          const rand = Math.random() * 2 - 1; // -1 to 1
          const multiplier = pathType === 'pessimistic' ? -1 : pathType === 'optimistic' ? 1 : 0;
          returnRate *= (1 + multiplier * monthlyVol * Math.abs(rand));
        }

        savings += netCashflow;
        invested += monthlyInvestment;
        invested *= (1 + returnRate);
        const totalWealth = savings + invested;

        monthlyData.push({
          month: m,
          income,
          expense,
          netCashflow,
          savings,
          invested,
          totalWealth,
          path: pathType,
        });
      }
      return monthlyData;
    });

    const finalExpected = projections[1][projections[1].length - 1];
    const finalPessimistic = projections[0][projections[0].length - 1];
    const finalOptimistic = projections[2][projections[2].length - 1];

    return {
      baseMetrics: base,
      scenario,
      horizon: months,
      monthlyData: projections[1], // expected path for main chart
      allPaths: projections.flat(),
      summary: {
        finalWealth: finalExpected.totalWealth,
        wealthChange: finalExpected.totalWealth - currentSavings,
        finalSavings: finalExpected.savings,
        finalInvested: finalExpected.invested,
        totalContributed: monthlyInvestment * months,
        investmentGain: finalExpected.invested - monthlyInvestment * months,
        pessimisticWealth: finalPessimistic.totalWealth,
        optimisticWealth: finalOptimistic.totalWealth,
        monthlyNetCashflow: income - expense,
        newSavingsRate: savingsRate,
        breakEvenMonth: finalExpected.totalWealth > currentSavings ? 1 : null,
      },
    };
  }

  if (loading || !baseMetrics) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  const formatMonthLabel = (m: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + m - 1);
    return MONTHS[date.getMonth()];
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>🔮 Mô phỏng tài chính (What-If)</h2>

      {/* Current Financial Snapshot */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📸 Tiền cảnh hiện tại (TB 6 tháng)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Thu nhập/tháng</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--income)' }}>{fmt(baseMetrics.monthlyIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Chi tiêu/tháng</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--expense)' }}>{fmt(baseMetrics.monthlyExpense)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Ròng/tháng</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: baseMetrics.monthlyNet >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {fmt(baseMetrics.monthlyNet)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Tiết kiệm hiện tại</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--saving)' }}>{fmt(baseMetrics.currentSavings)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Tỷ lệ tiết kiệm</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{baseMetrics.savingsRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>🎬 Chọn kịch bản hoặc tự tùy chỉnh</h3>

        {/* Preset Scenarios */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Kịch bản có sẵn</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {PRESET_SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  // Auto-fill category reductions for food-related categories
                  const adjusted = { ...s };
                  if (s.id === 'reduce-food' || s.id === 'no-spend') {
                    const foodCats = categories
                      .filter(c => c.type === 'Expense')
                      .filter(c => ['ăn', 'uống', 'cà phê', 'delivery', 'food', 'drink', 'coffee'].some(k =>
                        c.name.toLowerCase().includes(k)
                      ));
                    adjusted.adjustments = {
                      ...s.adjustments,
                      expenseChanges: foodCats.reduce((acc, c) => {
                        acc[c.id] = s.id === 'no-spend' ? -50 : -20;
                        return acc;
                      }, {} as Record<string, number>),
                    };
                  }
                  setSelectedScenario(adjusted);
                  setCustomAdjustments({});
                }}
                className={`glass-btn ${selectedScenario?.id === s.id ? 'glass-btn-primary' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16 20', minWidth: 140, textAlign: 'center' }}
              >
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Adjustments */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Tùy chỉnh thủ công</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Thay đổi thu nhập (%)
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}> {customAdjustments.incomeChange || 0}%</span>
              </label>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={customAdjustments.incomeChange || 0}
                onChange={e => setCustomAdjustments({ ...customAdjustments, incomeChange: +e.target.value })}
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Tỷ lệ tiết kiệm (% thu nhập)
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}> {customAdjustments.savingsRate || 0}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={customAdjustments.savingsRate || 0}
                onChange={e => setCustomAdjustments({ ...customAdjustments, savingsRate: +e.target.value })}
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Lãi đầu tư dự kiến (%/năm)
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}> {customAdjustments.investmentReturn || 0}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={customAdjustments.investmentReturn || 0}
                onChange={e => setCustomAdjustments({ ...customAdjustments, investmentReturn: +e.target.value })}
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Khoảng thời gian (tháng)
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}> {horizon}th</span>
              </label>
              <input
                type="range"
                min="6"
                max="60"
                step="6"
                value={horizon}
                onChange={e => setHorizon(+e.target.value)}
                className="glass-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Category expense sliders */}
          {Object.entries(baseMetrics.categoryExpense).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Điều chỉnh chi theo danh mục</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {Object.entries(baseMetrics.categoryExpense)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .slice(0, 8)
                  .map(([catId, cat]) => (
                    <div key={catId} style={{ padding: 12, background: 'var(--glass-bg-strong)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{cat.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(cat.amount)}/tháng</div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="5"
                        value={customAdjustments.expenseChanges?.[catId] || 0}
                        onChange={e => setCustomAdjustments({
                          ...customAdjustments,
                          expenseChanges: { ...customAdjustments.expenseChanges, [catId]: +e.target.value }
                        })}
                        className="glass-input"
                        style={{ width: '100%' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {customAdjustments.expenseChanges?.[catId] || 0}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button
              onClick={() => { setSelectedScenario(null); setCustomAdjustments({}); }}
              className="glass-btn"
            >
              Xóa kịch bản
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <>
          {/* Summary Cards */}
          <div className="dashboard-cards stagger" style={{ marginBottom: 24 }}>
            <div className="glass-card interactive stat-card" style={{ '--role': 'var(--income)' } as React.CSSProperties}>
              <div className="stat-rune">💰</div>
              <div className="stat-tag">Tài sản cuối kỳ (TB)</div>
              <div className="stat-val" style={{ color: 'var(--income)' }}>{fmt(simulationResult.summary.finalWealth)}</div>
              <div className="stat-sub">{simulationResult.summary.wealthChange >= 0 ? '▲' : '▼'} {fmt(Math.abs(simulationResult.summary.wealthChange))} so với hiện tại</div>
            </div>
            <div className="glass-card interactive stat-card" style={{ '--role': 'var(--saving)' } as React.CSSProperties}>
              <div className="stat-rune">🏦</div>
              <div className="stat-tag">Tiền mặt tiết kiệm</div>
              <div className="stat-val" style={{ color: 'var(--saving)' }}>{fmt(simulationResult.summary.finalSavings)}</div>
            </div>
            <div className="glass-card interactive stat-card" style={{ '--role': 'var(--ornament)' } as React.CSSProperties}>
              <div className="stat-rune">📈</div>
              <div className="stat-tag">Đầu tư tự động</div>
              <div className="stat-val" style={{ color: 'var(--ornament)' }}>{fmt(simulationResult.summary.finalInvested)}</div>
              <div className="stat-sub">Lãi: {simulationResult.summary.investmentGain >= 0 ? '+' : ''}{fmt(simulationResult.summary.investmentGain)}</div>
            </div>
            <div className="glass-card interactive stat-card" style={{ '--role': 'var(--balance)' } as React.CSSProperties}>
              <div className="stat-rune">📊</div>
              <div className="stat-tag">Ròng tháng (sau kịch bản)</div>
              <div className="stat-val" style={{ color: simulationResult.summary.monthlyNetCashflow >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                {fmt(simulationResult.summary.monthlyNetCashflow)}
              </div>
              <div className="stat-sub">Tiết kiệm: {simulationResult.summary.newSavingsRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Range Projection */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📈 Dự báo phạm vi ({simulationResult.horizon} tháng)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: 12, color: 'var(--expense)', textTransform: 'uppercase', marginBottom: 8 }}>Bi quan</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--expense)' }}>{fmt(simulationResult.summary.pessimisticWealth)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Thị trường giảm, chi phí tăng</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: 12, color: 'var(--income)', textTransform: 'uppercase', marginBottom: 8 }}>Trung bình</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--income)' }}>{fmt(simulationResult.summary.finalWealth)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Kịch bản cơ sở</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(168,85,247,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div style={{ fontSize: 12, color: 'var(--ornament)', textTransform: 'uppercase', marginBottom: 8 }}>Lạc quan</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ornament)' }}>{fmt(simulationResult.summary.optimisticWealth)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Thị trường tăng, kiểm soát chi tốt</div>
              </div>
            </div>
          </div>

          {/* Wealth Projection Chart */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📊 Biểu đồ tài sản theo tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={simulationResult.monthlyData}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--income)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--saving)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--saving)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ornament)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--ornament)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" strokeOpacity={0.25} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatMonthLabel}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => fmtCompact(v)}
                />
                <Tooltip
                  formatter={(v: any, name: string) => [fmt(v), name]}
                  labelFormatter={formatMonthLabel}
                  contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="totalWealth" stroke="var(--income)" fill="url(#colorWealth)" strokeWidth={2} name="Tổng tài sản" />
                <Area type="monotone" dataKey="savings" stroke="var(--saving)" fill="url(#colorSavings)" strokeWidth={2} name="Tiền mặt" />
                <Area type="monotone" dataKey="invested" stroke="var(--ornament)" fill="url(#colorInvested)" strokeWidth={2} name="Đầu tư" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cashflow Breakdown Chart */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>💵 Dòng tiền tháng (kịch bản)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={simulationResult.monthlyData.slice(0, Math.min(12, simulationResult.horizon))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" strokeOpacity={0.25} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={formatMonthLabel} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtCompact(v)} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2.5} dot={false} name="Thu nhập" />
                <Line type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={2.5} dot={false} name="Chi tiêu" />
                <Line type="monotone" dataKey="netCashflow" stroke="var(--balance)" strokeWidth={2.5} strokeDasharray="5 5" dot={false} name="Ròng" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key Insights */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>💡 Insights chính</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
              <InsightCard
                icon="🎯"
                title="Mục tiết kiệm/tháng"
                value={fmt(simulationResult.monthlyData[0]?.netCashflow || 0)}
                desc="Số dư ròng hàng tháng theo kịch bản này"
                color="var(--income)"
              />
              <InsightCard
                icon="📅"
                title="Điểm hòa vốn"
                value={simulationResult.summary.breakEvenMonth ? `${simulationResult.summary.breakEvenMonth} tháng` : 'Đã dương'}
                desc="Thời gian tài sản vượt mức hiện tại"
                color="var(--saving)"
              />
              <InsightCard
                icon="📊"
                title="Biên độ rủi ro"
                value={fmt((simulationResult.summary.optimisticWealth - simulationResult.summary.pessimisticWealth) / 2)}
                desc="Chênh lệch giữa lạc quan & bi quan (±1σ)"
                color="var(--ornament)"
              />
              <InsightCard
                icon="💸"
                title="Tổng đóng góp"
                value={fmt(simulationResult.summary.totalContributed)}
                desc="Tiền bạn thực sự bỏ ra trong kỳ mô phỏng"
                color="var(--text-muted)"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ icon, title, value, desc, color }: { icon: string; title: string; value: string; desc: string; color: string }) {
  return (
    <div style={{ padding: 16, background: 'var(--glass-bg-strong)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{title}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{desc}</div>
    </div>
  );
}

interface BaseMetrics {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  monthlySavings: number;
  currentSavings: number;
  categoryExpense: Record<string, { amount: number; name: string; icon: string }>;
  savingsRate: number;
}

interface MonthlyProjection {
  month: number;
  income: number;
  expense: number;
  netCashflow: number;
  savings: number;
  invested: number;
  totalWealth: number;
  path: 'pessimistic' | 'expected' | 'optimistic';
}

interface SimulationResult {
  baseMetrics: BaseMetrics;
  scenario: Scenario;
  horizon: number;
  monthlyData: MonthlyProjection[];
  allPaths: MonthlyProjection[];
  summary: {
    finalWealth: number;
    wealthChange: number;
    finalSavings: number;
    finalInvested: number;
    totalContributed: number;
    investmentGain: number;
    pessimisticWealth: number;
    optimisticWealth: number;
    monthlyNetCashflow: number;
    newSavingsRate: number;
    breakEvenMonth: number | null;
  };
}