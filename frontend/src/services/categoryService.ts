import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, requireUid } from './firebase';
import type { Category, CreateCategoryDto } from '../types';

const categoriesCol = () => collection(db, 'users', requireUid(), 'categories');
const categoryDoc = (id: string) => doc(db, 'users', requireUid(), 'categories', id);

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const snap = await getDocs(categoriesCol());
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  },

  create: async (dto: CreateCategoryDto): Promise<Category> => {
    const ref = await addDoc(categoriesCol(), { ...dto, isDefault: false });
    return { id: ref.id, ...dto, isDefault: false };
  },

  update: async (id: string, dto: CreateCategoryDto): Promise<Category> => {
    const ref = categoryDoc(id);
    await updateDoc(ref, { ...dto });
    const snap = await getDoc(ref);
    return { id, ...(snap.data() as Omit<Category, 'id'>) };
  },

  delete: async (id: string): Promise<void> => {
    const ref = categoryDoc(id);
    const snap = await getDoc(ref);
    if (snap.exists() && (snap.data() as Category).isDefault) {
      throw new Error('Không thể xóa danh mục mặc định.');
    }
    await deleteDoc(ref);
  },
};
