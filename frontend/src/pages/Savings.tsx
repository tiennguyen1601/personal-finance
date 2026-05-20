import { useEffect, useState } from 'react';
import Modal from '../components/Common/Modal';
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Tên mục tiêu *</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Mua điện thoại" required />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Icon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ICONS.map(i => (
            <button key={i} type="button" onClick={() => setIcon(i)}
              style={{ width: 36, height: 36, fontSize: 18, border: '2px solid', borderColor: icon === i ? '#3b82f6' : '#e2e8f0', borderRadius: 8, cursor: 'pointer', background: icon === i ? '#eff6ff' : 'white' }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Màu</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Số tiền mục tiêu (để trống nếu không có)</label>
        <input style={inputStyle} type="number" min="0" value={target} onChange={e => setTarget(e.target.value)} placeholder="VD: 15000000" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Deadline (tuỳ chọn)</label>
        <input style={inputStyle} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Huỷ
        </button>
        <button type="submit"
          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
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
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSubmit({ amount: Number(amount), note: note || undefined, date });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginBottom: 16, color: '#64748b', fontSize: 14 }}>Nạp tiền vào: <strong>{goalName}</strong></p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Số tiền *</label>
        <input style={inputStyle} type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="VD: 500000" required />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Ghi chú</label>
        <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Tuỳ chọn" />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Ngày</label>
        <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Huỷ
        </button>
        <button type="submit"
          style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Nạp tiền
        </button>
      </div>
    </form>
  );
}

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [depositing, setDepositing] = useState<SavingsGoal | null>(null);

  const load = () => savingsService.getAll().then(setGoals);
  useEffect(() => { load(); }, []);

  const handleCreate = async (dto: CreateSavingsGoalDto) => {
    await savingsService.create(dto);
    setShowCreate(false);
    load();
  };

  const handleUpdate = async (dto: CreateSavingsGoalDto) => {
    if (!editing) return;
    await savingsService.update(editing.id, dto);
    setEditing(null);
    load();
  };

  const handleDelete = async (goal: SavingsGoal) => {
    if (!confirm(`Xóa mục tiêu "${goal.name}"? Tất cả lịch sử nạp tiền cũng sẽ bị xóa.`)) return;
    await savingsService.delete(goal.id);
    load();
  };

  const handleDeposit = async (dto: CreateSavingsEntryDto) => {
    if (!depositing) return;
    await savingsService.addEntry(depositing.id, dto);
    setDepositing(null);
    load();
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Tiết kiệm 🐷</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Tổng đã tiết kiệm: <strong style={{ color: '#8b5cf6' }}>{fmt(totalSaved)}</strong>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Tạo mục tiêu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {goals.map(goal => {
          const pct = goal.targetAmount ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : null;
          return (
            <div key={goal.id} style={{
              background: 'white', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${goal.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{goal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{goal.name}</div>
                    {goal.deadline && (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
                {goal.isCompleted && (
                  <span style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                    Hoàn thành 🎉
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Đã tiết kiệm</span>
                  <span style={{ fontWeight: 600, color: goal.color }}>{fmt(goal.currentAmount)}</span>
                </div>
                {goal.targetAmount && (
                  <>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: goal.color, borderRadius: 99, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      <span>{pct}%</span>
                      <span>Mục tiêu: {fmt(goal.targetAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDepositing(goal)}
                  style={{ flex: 1, background: goal.color, color: 'white', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  + Nạp tiền
                </button>
                {!goal.isDefault && (
                  <>
                    <button onClick={() => setEditing(goal)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#3b82f6', fontSize: 13 }}>
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(goal)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
