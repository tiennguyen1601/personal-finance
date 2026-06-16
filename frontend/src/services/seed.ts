import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { TransactionType } from '../types';

interface SeedCategory {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Ăn uống', icon: '🍔', color: '#ef4444', type: 'Expense' },
  { name: 'Di chuyển', icon: '🚗', color: '#f97316', type: 'Expense' },
  { name: 'Giải trí', icon: '🎮', color: '#a855f7', type: 'Expense' },
  { name: 'Mua sắm', icon: '🛍️', color: '#ec4899', type: 'Expense' },
  { name: 'Sức khỏe', icon: '💊', color: '#14b8a6', type: 'Expense' },
  { name: 'Hóa đơn', icon: '📄', color: '#64748b', type: 'Expense' },
  { name: 'Lương', icon: '💰', color: '#22c55e', type: 'Income' },
  { name: 'Thưởng', icon: '🎁', color: '#eab308', type: 'Income' },
  { name: 'Đầu tư', icon: '📈', color: '#3b82f6', type: 'Income' },
  { name: 'Khác', icon: '💡', color: '#78716c', type: 'Income' },
];

/**
 * Seed dữ liệu mặc định cho user mới: 10 danh mục + 1 quỹ tiết kiệm mặc định.
 * Dùng batch để ghi nguyên tử.
 */
export async function seedDefaults(uid: string): Promise<void> {
  const batch = writeBatch(db);

  const categoriesRef = collection(db, 'users', uid, 'categories');
  for (const c of DEFAULT_CATEGORIES) {
    batch.set(doc(categoriesRef), { ...c, isDefault: true });
  }

  const goalsRef = collection(db, 'users', uid, 'savingsGoals');
  batch.set(doc(goalsRef), {
    name: 'Tiết kiệm chung',
    icon: '🐷',
    color: '#8b5cf6',
    targetAmount: null,
    deadline: null,
    isDefault: true,
    createdAt: new Date().toISOString(),
  });

  await batch.commit();
}
