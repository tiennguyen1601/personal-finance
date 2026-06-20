import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../components/Common/Modal';
import { SkeletonGoalCard } from '../components/Common/Skeleton';
import { EmptyState } from '../components/Common/EmptyState';
import { savingsService } from '../services/savingsService';
import type { SavingsGoal, CreateSavingsGoalDto, CreateSavingsEntryDto } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const today = () => new Date().toISOString().slice(0, 10);

const ICONS = ['🐷','🎯','🏠','🚗','✈️','📱','💍','🎓','🏥','💻','🛒','🌴'];
const COLORS = ['#8b5cf6','#3b82f6','#22c55e','#ef4444','#f97316','#ec4899','#0891b2','#eab308','#64748b','#14b8a6'];

function GoalForm({ initial, onSubmit, onCancel }: {
  initial?: SavingsGoal;
  onSubmit: (dto: CreateSavingsGoalDto) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🐷');
  const [color, setColor] = useState(initial?.color ?? '#8b5cf6');
  const [target, setTarget] = useState(initial?.targetAmount?.toString() ?? '');
  const [deadline, setDeadline] = useState(initial?.deadline?.slice(0, 10) ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      icon,
      color,
      targetAmount: target ? Number(target) : null,
      deadline: deadline || null,
    });
  };

  const inputProps = { className: 'glass-input', style: { width: '100%', boxSizing: 'border-box' as const } };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tên mục tiêu *</label>
        <input {...inputProps} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Mua điện thoại" required />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Icon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ICONS.map(i => (
            <button key={i} type="button" onClick={() => setIcon(i)}
              style={{ width: 36, height: 36, fontSize: 18, border: 'var(--bw) solid', borderColor: icon === i ? 'var(--accent)' : 'var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-strong)', background: icon === i ? 'var(--accent-glow)' : 'var(--glass-bg-strong)' }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Màu</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text-strong)' : '2px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Số tiền mục tiêu (để trống nếu không có)</label>
        <input {...inputProps} type="number" min="0" value={target} onChange={e => setTarget(e.target.value)} placeholder="VD: 15000000" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Deadline (tuỳ chọn)</label>
        <input {...inputProps} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="glass-btn">Huỷ</button>
        <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '8px 16px' }}>
          {initial ? 'Lưu' : 'Tạo'}
        </button>
      </div>
    </form>
  );
}

function EntryForm({ goalName, onSubmit, onCancel }: {
  goalName: string;
  onSubmit: (dto: CreateSavingsEntryDto) => void;
  onCancel: () => void;
}) {
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setAmountRaw(num);
    setAmountDisplay(num ? new Intl.NumberFormat('vi-VN').format(num) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountRaw || amountRaw <= 0) return;
    onSubmit({ amount: amountRaw, note: note || undefined, date });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>Nạp tiền vào: <strong>{goalName}</strong></p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Số tiền *</label>
        <input className="glass-input" type="text" inputMode="numeric" value={amountDisplay} onChange={handleAmountChange} placeholder="VD: 500.000" required />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ghi chú</label>
        <input className="glass-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Tuỳ chọn" />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ngày</label>
        <input className="glass-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="glass-btn">Huỷ</button>
        <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '8px 16px' }}>Nạp tiền</button>
      </div>
    </form>
  );
}

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [depositing, setDepositing] = useState<SavingsGoal | null>(null);

  const load = () => savingsService.getAll().then(setGoals);

  useEffect(() => {
    savingsService.getAll()
      .then(setGoals)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (dto: CreateSavingsGoalDto) => {
    await savingsService.create(dto);
    setShowCreate(false);
    load();
    toast.success('Đã tạo mục tiêu tiết kiệm');
  };

  const handleUpdate = async (dto: CreateSavingsGoalDto) => {
    if (!editing) return;
    await savingsService.update(editing.id, dto);
    setEditing(null);
    load();
    toast.success('Đã cập nhật mục tiêu');
  };

  const handleDelete = async (goal: SavingsGoal) => {
    if (!confirm(`Xóa mục tiêu "${goal.name}"? Tất cả lịch sử nạp tiền cũng sẽ bị xóa.`)) return;
    await savingsService.delete(goal.id);
    load();
    toast.success(`Đã xóa "${goal.name}"`);
  };

  const handleDeposit = async (dto: CreateSavingsEntryDto) => {
    if (!depositing) return;
    await savingsService.addEntry(depositing.id, dto);
    setDepositing(null);
    load();
    toast.success('Đã nạp tiền thành công 🎉');
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Tiết kiệm 🐷</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Tổng đã tiết kiệm: <strong style={{ color: 'var(--saving)' }}>{fmt(totalSaved)}</strong>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="glass-btn glass-btn-primary">
          + Tạo mục tiêu
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonGoalCard key={i} />)}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon="🐷"
          title="Chưa có mục tiêu tiết kiệm"
          description="Hãy tạo mục tiêu đầu tiên để theo dõi kế hoạch tiết kiệm của bạn!"
          action={
            <button onClick={() => setShowCreate(true)} className="glass-btn glass-btn-primary">
              + Tạo mục tiêu
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {goals.map(goal => {
            const pct = goal.targetAmount ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : null;
            return (
              <div key={goal.id} className="glass-card interactive" style={{ padding: 20, borderLeft: `4px solid ${goal.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{goal.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>{goal.name}</div>
                      {goal.deadline && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>
                  {goal.isCompleted && (
                    <span className="chip" style={{ color: 'var(--income)' }}>
                      Hoàn thành 🎉
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đã tiết kiệm</span>
                    <span style={{ fontWeight: 600, color: goal.color }}>{fmt(goal.currentAmount)}</span>
                  </div>
                  {goal.targetAmount && (
                    <>
                      <div style={{ background: 'var(--glass-bg-strong)', border: 'var(--bw) solid var(--glass-border)', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--saving), var(--ornament))', borderRadius: 999, boxShadow: 'var(--glow)', transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>{pct}%</span>
                        <span>Mục tiêu: {fmt(goal.targetAmount)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDepositing(goal)} className="glass-btn glass-btn-primary" style={{ flex: 1, fontSize: 13, padding: '8px 0' }}>
                    + Nạp tiền
                  </button>
                  {!goal.isDefault && (
                    <>
                      <button onClick={() => setEditing(goal)} className="glass-btn" style={{ fontSize: 13, padding: '8px 12px' }}>Sửa</button>
                      <button onClick={() => handleDelete(goal)} className="glass-btn glass-btn-danger" style={{ fontSize: 13, padding: '8px 12px' }}>Xóa</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="Tạo mục tiêu tiết kiệm" onClose={() => setShowCreate(false)}>
          <GoalForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Sửa mục tiêu" onClose={() => setEditing(null)}>
          <GoalForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {depositing && (
        <Modal title="Nạp tiền tiết kiệm" onClose={() => setDepositing(null)}>
          <EntryForm goalName={depositing.name} onSubmit={handleDeposit} onCancel={() => setDepositing(null)} />
        </Modal>
      )}
    </div>
  );
}
