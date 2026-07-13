import { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { savingsService } from '../services/savingsService';
import { useAppStore } from '../store/appStore';
import type { Transaction, SavingsGoal } from '../types';
import toast from 'react-hot-toast';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';

interface Challenge {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'streak' | 'target' | 'habit' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard';
  reward: { xp: number; badge?: string };
  config: {
    days?: number;           // for streak
    targetAmount?: number;   // for target
    categoryId?: string;     // for habit
    maxDailyExpense?: number; // for habit
  };
  progress: number; // 0-100
  completed: boolean;
  currentStreak: number;
  bestStreak: number;
  startDate: string;
  endDate?: string;
}

interface UserProgress {
  level: number;
  xp: number;
  xpToNext: number;
  badges: string[];
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  totalSaved: number;
}

const PRESET_CHALLENGES: Omit<Challenge, 'progress' | 'completed' | 'currentStreak' | 'bestStreak' | 'startDate'>[] = [
  {
    id: 'no-spend-week',
    name: 'Tuần không chi tiêu',
    icon: '🚫',
    description: 'Không chi tiêu gì ngoài ăn/ở/di chuyển trong 7 ngày',
    type: 'streak',
    difficulty: 'medium',
    reward: { xp: 100, badge: '🛡️' },
    config: { days: 7, maxDailyExpense: 50000 },
  },
  {
    id: '52-week',
    name: 'Thử thách 52 tuần',
    icon: '📅',
    description: 'Tuần 1 tiết kiệm 10K, tuần 2 tiết kiệm 20K... tuần 52 tiết kiệm 520K',
    type: 'target',
    difficulty: 'hard',
    reward: { xp: 500, badge: '🏆' },
    config: { targetAmount: 1378000, days: 364 }, // 10+20+...+520 = 13780 * 100 = 1,378,000
  },
  {
    id: 'round-up',
    name: 'Làm tròn giao dịch',
    icon: '💰',
    description: 'Mỗi giao dịch làm tròn lên 10K/50K/100K, chênh lệch vào tiết kiệm',
    type: 'habit',
    difficulty: 'easy',
    reward: { xp: 50, badge: '🪙' },
    config: { categoryId: '', maxDailyExpense: 0 }, // applies to all
  },
  {
    id: 'coffee-free',
    name: 'Cài cà phê outside',
    icon: '☕',
    description: 'Không mua cà phê bên ngoài 30 ngày, tự pha tại nhà',
    type: 'streak',
    difficulty: 'medium',
    reward: { xp: 150, badge: '☕' },
    config: { days: 30, categoryId: '' }, // will match coffee category
  },
  {
    id: 'emergency-fund',
    name: 'Quỹ khẩn cấp 3 tháng',
    icon: '🛡️',
    description: 'Tích lũy 3 tháng chi tiêu trung bình vào quỹ khẩn cấp',
    type: 'target',
    difficulty: 'hard',
    reward: { xp: 300, badge: '🏦' },
    config: { targetAmount: 0, days: 180 }, // calculated dynamically
  },
  {
    id: 'daily-budget',
    name: 'Tuân thủ ngân sách ngày',
    icon: '📊',
    description: 'Không vượt hạn mức chi/ngày tính từ Dashboard trong 14 ngày',
    type: 'streak',
    difficulty: 'medium',
    reward: { xp: 120, badge: '📋' },
    config: { days: 14 },
  },
];

const BADGES = [
  { id: 'first-save', name: 'Người mới bắt đầu', icon: '🌱', desc: 'Hoàn thành thử thách đầu tiên' },
  { id: 'streak-7', name: 'Người kiên nhẫn', icon: '🔥', desc: 'Duy trì streak 7 ngày' },
  { id: 'streak-30', name: 'Thánh tiết kiệm', icon: '🏅', desc: 'Duy trì streak 30 ngày' },
  { id: 'save-1m', name: 'Triệu phú nhỏ', icon: '💰', desc: 'Tiết kiệm được 1 triệu' },
  { id: 'save-10m', name: 'Bậc thầy tài chính', icon: '💎', desc: 'Tiết kiệm được 10 triệu' },
  { id: 'all-categories', name: 'Người cân bằng', icon: '⚖️', desc: 'Có giao dịch ở 5+ danh mục' },
  { id: 'no-spend-month', name: 'Thần kiểm soát', icon: '🧘', desc: 'Tháng không chi tiêu lãng phí' },
];

const LEVELS = [
  { level: 1, xp: 0, title: 'Novice 🌱' },
  { level: 2, xp: 100, title: 'Beginner 🌿' },
  { level: 3, xp: 300, title: 'Saver 🌳' },
  { level: 4, xp: 600, title: 'Budgeter 🏠' },
  { level: 5, xp: 1000, title: 'Investor 📈' },
  { level: 6, xp: 1500, title: 'Planner 🏦' },
  { level: 7, xp: 2100, title: 'Master 💎' },
  { level: 8, xp: 2800, title: 'Guru 🧙' },
  { level: 9, xp: 3600, title: 'Legend 🏆' },
  { level: 10, xp: 4500, title: 'Financial God 👑' },
];

export default function Challenges() {
  const { categories } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1, xp: 0, xpToNext: 100, badges: [], completedChallenges: 0,
    currentStreak: 0, longestStreak: 0, totalSaved: 0,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [customChallenge, setCustomChallenge] = useState<{ name: string; icon: string; description: string; type: 'streak' | 'target' | 'habit'; days: number; targetAmount: number }>({
  name: '', icon: '🎯', description: '', type: 'streak', days: 7, targetAmount: 0
});

  // Load data
  useEffect(() => {
    Promise.all([
      transactionService.getAll({}),
      savingsService.getAll(),
    ]).then(([txs, gls]) => {
      setTransactions(txs);
      setGoals(gls);
      setLoading(false);
      loadProgress();
      initChallenges(txs);
    });
  }, []);

  function loadProgress() {
    // Load from localStorage
    const saved = localStorage.getItem('challenge-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserProgress(parsed);
      } catch {}
    }
  }

  function saveProgress() {
    localStorage.setItem('challenge-progress', JSON.stringify(userProgress));
  }

  function initChallenges(txs: Transaction[]) {
    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);

    // Calculate average monthly expense for emergency fund target
    const recentMonths = 3;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - recentMonths, 1);
    const recentExpenses = txs.filter(t => t.type === 'Expense' && new Date(t.date) >= cutoff);
    const avgMonthlyExpense = recentExpenses.reduce((s, t) => s + t.amount, 0) / recentMonths;

    // Calculate coffee category
    const coffeeCat = categories.find(c =>
      c.type === 'Expense' && ['cà phê', 'cafe', 'coffee', 'đồ uống', 'drink'].some(k => c.name.toLowerCase().includes(k))
    );

    const initialized: Challenge[] = PRESET_CHALLENGES.map(c => {
      let config = { ...c.config };
      if (c.id === 'emergency-fund') {
        config.targetAmount = Math.round(avgMonthlyExpense * 3);
      }
      if (c.id === 'coffee-free' && coffeeCat) {
        config.categoryId = coffeeCat.id;
      }

      // Load saved progress for this challenge
      const savedChallenge = localStorage.getItem(`challenge-${c.id}`);
      let progress = 0, completed = false, currentStreak = 0, bestStreak = 0, challengeStartDate = startDate;
      if (savedChallenge) {
        try {
          const parsed = JSON.parse(savedChallenge);
          progress = parsed.progress || 0;
          completed = parsed.completed || false;
          currentStreak = parsed.currentStreak || 0;
          bestStreak = parsed.bestStreak || 0;
          challengeStartDate = parsed.startDate || startDate;
        } catch {}
      }

      return { ...c, config, progress, completed, currentStreak, bestStreak, startDate: challengeStartDate };
    });

    setChallenges(initialized);
  }

  function calculateChallengeProgress(challenge: Challenge, txs: Transaction[], gls: SavingsGoal[]): number {
    const now = new Date();
    const start = new Date(challenge.startDate);

    switch (challenge.type) {
      case 'streak': {
        // Count consecutive days meeting criteria
        let streak = 0;
        let maxStreak = 0;
        const days = challenge.config.days || 7;

        // Check each day from start to now
        for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
          const dayStr = d.toISOString().slice(0, 10);
          const dayTxs = txs.filter(t => t.date.slice(0, 10) === dayStr && t.type === 'Expense');

          let dayExpense = dayTxs.reduce((s, t) => s + t.amount, 0);

          // Filter by category if specified
          if (challenge.config.categoryId) {
            dayExpense = dayTxs.filter(t => t.categoryId === challenge.config.categoryId).reduce((s, t) => s + t.amount, 0);
          }

          const maxAllowed = challenge.config.maxDailyExpense || 0;
          const success = maxAllowed > 0 ? dayExpense <= maxAllowed : dayExpense === 0;

          if (success) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
          } else {
            streak = 0;
          }
        }

        return Math.min(100, Math.round((maxStreak / days) * 100));
      }

      case 'target': {
        // Total saved across all goals or specific target
        const totalSaved = gls.reduce((s, g) => s + g.currentAmount, 0);
        const target = challenge.config.targetAmount || 0;
        return target > 0 ? Math.min(100, Math.round((totalSaved / target) * 100)) : 0;
      }

      case 'habit': {
        // Round-up savings - simplified: check if user has savings entries recently
        const totalSaved = gls.reduce((s, g) => s + g.currentAmount, 0);
        // Mock: assume 10% of savings is from round-up
        return Math.min(100, Math.round((totalSaved * 0.1 / 500000) * 100));
      }

      default:
        return 0;
    }
  }

  function updateProgress() {
    setChallenges(prev => prev.map(c => {
      const progress = calculateChallengeProgress(c, transactions, goals);
      const completed = progress >= 100 && !c.completed;
      const currentStreak = c.currentStreak;
      const bestStreak = Math.max(c.bestStreak, currentStreak);

      const updated = { ...c, progress, completed, bestStreak };

      // Save to localStorage
      localStorage.setItem(`challenge-${c.id}`, JSON.stringify(updated));

      // Award XP if newly completed
      if (completed) {
        setUserProgress(up => {
          const newXp = up.xp + c.reward.xp;
          const newLevel = LEVELS.findLast(l => l.xp <= newXp)?.level || up.level;
          const nextLevel = LEVELS.find(l => l.level === newLevel + 1);
          const newBadges = [...up.badges];
          if (c.reward.badge && !up.badges.includes(c.reward.badge!)) {
            newBadges.push(c.reward.badge!);
          }
          return {
            ...up,
            xp: newXp,
            level: newLevel,
            xpToNext: nextLevel ? nextLevel.xp - newXp : 0,
            badges: newBadges,
            completedChallenges: up.completedChallenges + 1,
          };
        });
        toast.success(`🎉 Hoàn thành "${c.name}"! +${c.reward.xp} XP`);
      }

      return updated;
    }));
  }

  useEffect(() => {
    if (!loading) {
      updateProgress();
    }
  }, [transactions, goals, loading]);

  useEffect(() => {
    if (!loading) {
      saveProgress();
    }
  }, [userProgress]);

  // Get active challenge (highest progress not completed, or first not started)
  const active = useMemo(() => {
    return challenges.find(c => !c.completed && c.progress > 0) || challenges.find(c => !c.completed) || null;
  }, [challenges]);

  // Calculate current streak for active challenge
  const currentStreak = useMemo(() => {
    if (!active) return 0;
    let streak = 0;
    const now = new Date();
    for (let d = new Date(now); d >= new Date(active.startDate); d.setDate(d.getDate() - 1)) {
      const dayStr = d.toISOString().slice(0, 10);
      const dayTxs = transactions.filter(t => t.date.slice(0, 10) === dayStr && t.type === 'Expense');
      let dayExpense = dayTxs.reduce((s, t) => s + t.amount, 0);
      if (active.config.categoryId) {
        dayExpense = dayTxs.filter(t => t.categoryId === active.config.categoryId).reduce((s, t) => s + t.amount, 0);
      }
      const maxAllowed = active.config.maxDailyExpense || 0;
      const success = maxAllowed > 0 ? dayExpense <= maxAllowed : dayExpense === 0;
      if (success) streak++; else break;
    }
    return streak;
  }, [active, transactions]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang tải thử thách...
      </div>
    );
  }

  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === userProgress.level + 1);

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>🎮 Thử thách tiết kiệm (Gamification)</h2>

      {/* User Level & XP */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48 }}>🏅</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Cấp {userProgress.level}
              </span>
              <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>{currentLevel.title}</span>
            </div>
            <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${userProgress.level === 10 ? 100 : (userProgress.xp / (nextLevel?.xp || 100)) * 100}%`,
                height: '100%',
                background: 'var(--accent-grad)',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>{fmt(userProgress.xp)} XP</span>
              <span>{nextLevel ? `Còn ${fmt(nextLevel.xp - userProgress.xp)} XP đến cấp ${nextLevel.level}` : 'MAX LEVEL 👑'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 150 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thử thách hoàn thành</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--income)' }}>{userProgress.completedChallenges}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Streak hiện tại: <strong>{currentStreak} ngày</strong></div>
          </div>
        </div>
      </div>

      {/* Active Challenge Highlight */}
      {active && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 24, borderLeft: '4px solid var(--accent)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>{active.icon}</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{active.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>{active.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{active.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{active.progress}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hoàn thành</div>
              </div>
            </div>
            <div style={{ height: 10, background: 'var(--glass-border)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                width: `${active.progress}%`,
                height: '100%',
                background: 'var(--accent-grad)',
                borderRadius: 5,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>🔥 Streak: <strong>{currentStreak}</strong> / {active.config.days || '?'} ngày</span>
              <span>🏆 Best: <strong>{active.bestStreak}</strong> ngày</span>
              <span>⭐ Phần thưởng: +{active.reward.xp} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Challenges Grid */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📋 Danh sách thử thách</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {challenges.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              isActive={active?.id === c.id}
            />
          ))}
        </div>
      </div>

      {/* Custom Challenge Creator */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>✨ Tạo thử thách cá nhân</h3>
          <button onClick={() => setShowCreate(!showCreate)} className="glass-btn" style={{ fontSize: 12 }}>
            {showCreate ? 'Ẩn' : '+ Tạo mới'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={e => { e.preventDefault(); createCustomChallenge(); }} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Icon</label>
                <select value={customChallenge.icon} onChange={e => setCustomChallenge({...customChallenge, icon: e.target.value})} className="glass-select">
                  {['🎯','🏃','📚','💪','🧘','🎨','🎮','🍳','🚴','🏊','🧗','📝'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Loại</label>
                <select value={customChallenge.type} onChange={e => setCustomChallenge({...customChallenge, type: e.target.value as any})} className="glass-select">
                  <option value="streak">Streak (ngày liên tiếp)</option>
                  <option value="target">Mục tiêu số tiền</option>
                  <option value="habit">Thói quen</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Tên thử thách</label>
              <input value={customChallenge.name} onChange={e => setCustomChallenge({...customChallenge, name: e.target.value})} className="glass-input" style={{ width: '100%' }} placeholder="VD: Đi bộ 30 phút mỗi ngày" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Mô tả</label>
              <input value={customChallenge.description} onChange={e => setCustomChallenge({...customChallenge, description: e.target.value})} className="glass-input" style={{ width: '100%' }} placeholder="Mô tả ngắn gọn..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {customChallenge.type === 'target' ? 'Mục tiêu (đ)' : 'Số ngày'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={customChallenge.type === 'target' ? customChallenge.targetAmount : customChallenge.days}
                  onChange={e => {
                    const val = +e.target.value;
                    if (customChallenge.type === 'target') {
                      setCustomChallenge({ ...customChallenge, targetAmount: val });
                    } else {
                      setCustomChallenge({ ...customChallenge, days: val });
                    }
                  }}
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <button type="submit" className="glass-btn glass-btn-primary" style={{ justifySelf: 'start' }}>Tạo thử thách</button>
          </form>
        )}
      </div>

      {/* Badges */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>🏅 Huy hiệu đã mở</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {BADGES.map(b => {
            const earned = userProgress.badges.includes(b.icon);
            return (
              <div key={b.id} style={{
                width: 80, height: 80, borderRadius: '50%',
                background: earned ? 'var(--accent-grad)' : 'var(--glass-border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                opacity: earned ? 1 : 0.4,
                cursor: earned ? 'default' : 'not-allowed',
                border: earned ? '2px solid var(--accent)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }} title={earned ? b.desc : `Chưa mở: ${b.desc}`}>
                <span style={{ fontSize: 28 }}>{b.icon}</span>
                <span style={{ fontSize: 8, fontWeight: 600, textAlign: 'center', padding: '0 4', color: earned ? '#fff' : 'var(--text-muted)' }}>
                  {b.name}
                </span>
                {earned && <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: 'var(--income)', borderRadius: '50%', border: '2px solid var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#fff' }}>✓</span>
                </div>}
              </div>
            );
          })}
        </div>
        {userProgress.badges.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
            Chưa có huy hiệu nào. Hoàn thành thử thách để mở khóa! 🔓
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, isActive }: { challenge: Challenge; isActive: boolean }) {
  const difficultyColor = challenge.difficulty === 'easy' ? 'var(--income)' : challenge.difficulty === 'medium' ? 'var(--ornament)' : 'var(--expense)';

  return (
    <div className={`glass-card ${isActive ? 'interactive' : ''}`} style={{
      padding: 16, cursor: isActive ? 'default' : 'pointer',
      border: isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
      position: 'relative', overflow: 'hidden',
      transform: isActive ? 'scale(1.02)' : 'none',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      {challenge.completed && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 20 }}>✅</div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{challenge.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {challenge.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
            {challenge.description}
          </div>
        </div>
      </div>

      <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          width: `${challenge.progress}%`,
          height: '100%',
          background: challenge.completed ? 'var(--income)' : 'var(--accent-grad)',
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>{challenge.completed ? '✅ Hoàn thành' : `${challenge.progress}%`}</span>
        <span style={{ color: difficultyColor, fontWeight: 600, textTransform: 'uppercase' }}>
          {challenge.difficulty === 'easy' ? 'Dễ' : challenge.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>⭐ +{challenge.reward.xp} XP</span>
        {challenge.reward.badge && <span>{challenge.reward.badge}</span>}
        <span>🔥 {challenge.currentStreak}/{challenge.config.days || '?'} ngày</span>
      </div>
    </div>
  );
}

function createCustomChallenge() {
  // Handled in parent
}