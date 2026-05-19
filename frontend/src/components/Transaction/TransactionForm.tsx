import { useState } from 'react';
import type { Category, CreateTransactionDto, Transaction, TransactionType } from '../../types';

interface Props {
  categories: Category[];
  initial?: Transaction;
  onSubmit: (dto: CreateTransactionDto) => Promise<void>;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6
};

export default function TransactionForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'Expense');
  const [amount, setAmount] = useState(initial?.amount.toString() ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId.toString() ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const filtered = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ amount: parseFloat(amount), type, categoryId: parseInt(categoryId), note: note || undefined, date });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Loại</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Expense', 'Income'] as TransactionType[]).map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
              style={{ flex: 1, padding: '8px', border: '2px solid', borderColor: type === t ? (t === 'Expense' ? '#ef4444' : '#22c55e') : '#e2e8f0',
                background: type === t ? (t === 'Expense' ? '#fef2f2' : '#f0fdf4') : 'white',
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', color: type === t ? (t === 'Expense' ? '#ef4444' : '#16a34a') : '#64748b' }}>
              {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Số tiền (đ)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Danh mục</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={inputStyle}>
          <option value="">-- Chọn danh mục --</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Ngày</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Ghi chú</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="Không bắt buộc" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Hủy
        </button>
        <button type="submit" disabled={loading}
          style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm mới')}
        </button>
      </div>
    </form>
  );
}
