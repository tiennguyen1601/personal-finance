import { useState } from 'react';
import type { Category, CreateTransactionDto, Transaction, TransactionType } from '../../types';

interface Props {
  categories: Category[];
  initial?: Transaction;
  onSubmit: (dto: CreateTransactionDto) => Promise<void>;
  onCancel: () => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-strong)'
};

export default function TransactionForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'Expense');
  const [amount, setAmount] = useState(initial?.amount.toString() ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const filtered = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ amount: parseFloat(amount), type, categoryId, note: note || undefined, date });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Loại</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Expense', 'Income'] as TransactionType[]).map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
              className="chip"
              style={type === t
                ? { flex: 1, background: 'var(--accent-grad)', color: '#fff', cursor: 'pointer' }
                : { flex: 1, cursor: 'pointer' }}>
              {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Số tiền (đ)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" className="glass-input" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Danh mục</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="glass-select">
          <option value="">-- Chọn danh mục --</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Ngày</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="glass-input" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Ghi chú</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} className="glass-input" placeholder="Không bắt buộc" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} className="glass-btn" style={{ flex: 1 }}>
          Hủy
        </button>
        <button type="submit" disabled={loading} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
          {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm mới')}
        </button>
      </div>
    </form>
  );
}
