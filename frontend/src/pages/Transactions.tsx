import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../components/Common/Modal';
import TransactionForm from '../components/Transaction/TransactionForm';
import { SkeletonRow } from '../components/Common/Skeleton';
import { EmptyState } from '../components/Common/EmptyState';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { CreateTransactionDto, Transaction } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const PAGE_SIZE = 20;

export default function Transactions() {
  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const { categories, setCategories } = useAppStore();

  const load = () =>
    transactionService.getAll({ month, year }).then(setTransactions);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    transactionService.getAll({ month, year })
      .then(data => { setTransactions(data); setPage(1); })
      .finally(() => setLoading(false));
  }, [month, year]);

  const handleCreate = async (dto: CreateTransactionDto) => {
    await transactionService.create(dto);
    setShowModal(false);
    load();
    toast.success('Đã thêm giao dịch');
  };

  const handleUpdate = async (dto: CreateTransactionDto) => {
    if (!editing) return;
    await transactionService.update(editing.id, dto);
    setEditing(null);
    load();
    toast.success('Đã cập nhật giao dịch');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa giao dịch này?')) return;
    await transactionService.delete(id);
    load();
    toast.success('Đã xóa giao dịch');
  };

  const paged = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [year - 1, year, year + 1];

  return (
    <div>
      <div className="transactions-header">
        <h2 style={{ margin: 0, fontSize: 22 }}>Giao dịch</h2>
        <button onClick={() => setShowModal(true)}
          className="glass-btn glass-btn-primary"
          style={{ fontWeight: 600 }}>
          + Thêm giao dịch
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={month} onChange={e => setMonth(+e.target.value)}
          className="glass-select">
          {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="glass-select">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Ngày', 'Danh mục', 'Ghi chú', 'Loại', 'Số tiền', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="💳"
                      title="Chưa có giao dịch nào"
                      description={`Tháng ${month}/${year} chưa có giao dịch. Thêm giao dịch đầu tiên nhé!`}
                      action={
                        <button onClick={() => setShowModal(true)} className="glass-btn glass-btn-primary">
                          + Thêm giao dịch
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paged.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      <span style={{ marginRight: 6 }}>{t.categoryIcon}</span>{t.categoryName}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)' }}>{t.note ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="chip" style={{ fontSize: 12, fontWeight: 600,
                        color: t.type === 'Income' ? 'var(--income)' : 'var(--expense)' }}>
                        {t.type === 'Income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: t.type === 'Income' ? 'var(--income)' : 'var(--expense)' }}>
                      {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setEditing(t)} className="glass-btn" style={{ marginRight: 8 }}>Sửa</button>
                      <button onClick={() => handleDelete(t.id)} className="glass-btn glass-btn-danger">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={p === page ? 'glass-btn glass-btn-primary' : 'glass-btn'}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Thêm giao dịch" onClose={() => setShowModal(false)}>
          <TransactionForm categories={categories} onSubmit={handleCreate} onCancel={() => setShowModal(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Sửa giao dịch" onClose={() => setEditing(null)}>
          <TransactionForm categories={categories} initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
