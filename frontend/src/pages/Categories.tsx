import { useEffect, useState } from 'react';
import Modal from '../components/Common/Modal';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { Category, CreateCategoryDto, TransactionType } from '../types';

const ICONS = ['🍔','🚗','🎮','🛍️','💊','📄','💰','🎁','📈','💡','✈️','🏠','📚','🎵','🏋️','☕','🎂','🐶'];
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#a855f7','#ec4899','#64748b','#78716c'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box'
};

export default function Categories() {
  const { categories, setCategories } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💡');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<TransactionType>('Expense');
  const [loading, setLoading] = useState(false);

  const load = () => categoryService.getAll().then(setCategories);
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setName(''); setIcon('💡'); setColor('#3b82f6'); setType('Expense');
    setShowModal(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c); setName(c.name); setIcon(c.icon); setColor(c.color); setType(c.type);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dto: CreateCategoryDto = { name, icon, color, type };
    if (editing) await categoryService.update(editing.id, dto);
    else await categoryService.create(dto);
    setShowModal(false);
    await load();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return;
    try {
      await categoryService.delete(id);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Không thể xóa.');
    }
  };

  const expense = categories.filter(c => c.type === 'Expense');
  const income = categories.filter(c => c.type === 'Income');

  const renderGroup = (title: string, items: Category[]) => (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, margin: '0 0 16px', color: '#374151' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {items.map(c => (
          <div key={c.id} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>{c.name}</div>
            {!c.isDefault ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(c)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', background: 'white', color: '#3b82f6' }}>Sửa</button>
                <button onClick={() => handleDelete(c.id)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #fee2e2', borderRadius: 6, cursor: 'pointer', background: '#fef2f2', color: '#ef4444' }}>Xóa</button>
              </div>
            ) : (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Mặc định</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Danh mục</h2>
        <button onClick={openCreate}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Thêm danh mục
        </button>
      </div>

      {renderGroup('Chi tiêu', expense)}
      {renderGroup('Thu nhập', income)}

      {showModal && (
        <Modal title={editing ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Tên</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map(i => (
                  <button key={i} type="button" onClick={() => setIcon(i)}
                    style={{ width: 36, height: 36, border: '2px solid', borderColor: icon === i ? '#3b82f6' : '#e2e8f0', borderRadius: 8, fontSize: 18, cursor: 'pointer', background: icon === i ? '#eff6ff' : 'white' }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Màu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            {!editing && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Loại</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Expense', 'Income'] as TransactionType[]).map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      style={{ flex: 1, padding: 8, border: '2px solid', borderColor: type === t ? '#3b82f6' : '#e2e8f0',
                        borderRadius: 8, fontWeight: 600, cursor: 'pointer', background: type === t ? '#eff6ff' : 'white', color: type === t ? '#3b82f6' : '#64748b' }}>
                      {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm mới')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
