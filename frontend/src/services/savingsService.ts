import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, requireUid } from './firebase';
import type { SavingsGoal, CreateSavingsGoalDto, CreateSavingsEntryDto } from '../types';

const goalsCol = (uid: string) => collection(db, 'users', uid, 'savingsGoals');
const goalDoc = (uid: string, id: string) => doc(db, 'users', uid, 'savingsGoals', id);
const entriesCol = (uid: string) => collection(db, 'users', uid, 'savingsEntries');
const entryDoc = (uid: string, id: string) => doc(db, 'users', uid, 'savingsEntries', id);

interface GoalData {
  name: string;
  icon: string;
  color: string;
  targetAmount: number | null;
  deadline: string | null;
  isDefault: boolean;
}

export const savingsService = {
  getAll: async (): Promise<SavingsGoal[]> => {
    const uid = requireUid();
    const [goalsSnap, entriesSnap] = await Promise.all([
      getDocs(goalsCol(uid)),
      getDocs(entriesCol(uid)),
    ]);

    const sums = new Map<string, number>();
    entriesSnap.docs.forEach((d) => {
      const e = d.data() as { goalId: string; amount: number };
      sums.set(e.goalId, (sums.get(e.goalId) ?? 0) + e.amount);
    });

    return goalsSnap.docs.map((d) => {
      const data = d.data() as GoalData;
      const currentAmount = sums.get(d.id) ?? 0;
      return {
        id: d.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        targetAmount: data.targetAmount ?? null,
        deadline: data.deadline ?? null,
        isDefault: !!data.isDefault,
        currentAmount,
        isCompleted: data.targetAmount != null && currentAmount >= data.targetAmount,
      };
    });
  },

  create: async (dto: CreateSavingsGoalDto): Promise<void> => {
    await addDoc(goalsCol(requireUid()), {
      ...dto,
      isDefault: false,
      createdAt: new Date().toISOString(),
    });
  },

  update: async (id: string, dto: CreateSavingsGoalDto): Promise<void> => {
    await updateDoc(goalDoc(requireUid(), id), { ...dto });
  },

  delete: async (id: string): Promise<void> => {
    const uid = requireUid();
    const ref = goalDoc(uid, id);
    const snap = await getDoc(ref);
    if (snap.exists() && (snap.data() as GoalData).isDefault) {
      throw new Error('Không thể xóa quỹ tiết kiệm mặc định.');
    }
    // Xóa goal + toàn bộ entries của nó trong 1 batch.
    const related = await getDocs(query(entriesCol(uid), where('goalId', '==', id)));
    const batch = writeBatch(db);
    related.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
  },

  addEntry: async (goalId: string, dto: CreateSavingsEntryDto): Promise<void> => {
    await addDoc(entriesCol(requireUid()), {
      goalId,
      amount: dto.amount,
      note: dto.note ?? null,
      date: dto.date,
      createdAt: new Date().toISOString(),
    });
  },

  deleteEntry: async (entryId: string): Promise<void> => {
    await deleteDoc(entryDoc(requireUid(), entryId));
  },
};
