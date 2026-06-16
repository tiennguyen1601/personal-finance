import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, requireUid } from './firebase';
import type { Transaction, CreateTransactionDto } from '../types';

const txCol = (uid: string) => collection(db, 'users', uid, 'transactions');
const txDoc = (uid: string, id: string) => doc(db, 'users', uid, 'transactions', id);

interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
}

async function loadCategoryMap(uid: string): Promise<Map<string, CategoryInfo>> {
  const snap = await getDocs(collection(db, 'users', uid, 'categories'));
  const map = new Map<string, CategoryInfo>();
  snap.docs.forEach((d) => {
    const c = d.data() as CategoryInfo;
    map.set(d.id, { name: c.name, icon: c.icon, color: c.color });
  });
  return map;
}

function enrich(
  id: string,
  data: Omit<Transaction, 'id' | 'categoryName' | 'categoryIcon' | 'categoryColor'>,
  cats: Map<string, CategoryInfo>
): Transaction {
  const c = cats.get(data.categoryId);
  return {
    id,
    amount: data.amount,
    type: data.type,
    note: data.note,
    date: data.date,
    createdAt: data.createdAt,
    categoryId: data.categoryId,
    categoryName: c?.name ?? '(đã xóa)',
    categoryIcon: c?.icon ?? '❓',
    categoryColor: c?.color ?? '#94a3b8',
  };
}

export const transactionService = {
  getAll: async (params?: {
    month?: number;
    year?: number;
    categoryId?: string;
    type?: string;
  }): Promise<Transaction[]> => {
    const uid = requireUid();
    const [txSnap, cats] = await Promise.all([getDocs(txCol(uid)), loadCategoryMap(uid)]);

    let list = txSnap.docs.map((d) =>
      enrich(d.id, d.data() as Omit<Transaction, 'id' | 'categoryName' | 'categoryIcon' | 'categoryColor'>, cats)
    );

    if (params?.year) list = list.filter((t) => Number(t.date.slice(0, 4)) === params.year);
    if (params?.month) list = list.filter((t) => Number(t.date.slice(5, 7)) === params.month);
    if (params?.categoryId) list = list.filter((t) => t.categoryId === params.categoryId);
    if (params?.type) list = list.filter((t) => t.type === params.type);

    // Mới nhất lên đầu: theo ngày, rồi theo thời điểm tạo.
    return list.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  },

  create: async (dto: CreateTransactionDto): Promise<Transaction> => {
    const uid = requireUid();
    const payload = {
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId,
      note: dto.note ?? null,
      date: dto.date,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(txCol(uid), payload);
    const cats = await loadCategoryMap(uid);
    return enrich(ref.id, { ...payload, note: dto.note }, cats);
  },

  update: async (id: string, dto: CreateTransactionDto): Promise<Transaction> => {
    const uid = requireUid();
    const payload = {
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId,
      note: dto.note ?? null,
      date: dto.date,
    };
    await updateDoc(txDoc(uid, id), payload);
    const cats = await loadCategoryMap(uid);
    return enrich(id, { ...payload, note: dto.note, createdAt: '' }, cats);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(txDoc(requireUid(), id));
  },
};
