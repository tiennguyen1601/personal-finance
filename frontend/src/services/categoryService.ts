import api from './api';
import type { Category, CreateCategoryDto } from '../types';

export const categoryService = {
  getAll: () => api.get<Category[]>('/categories').then(r => r.data),
  create: (dto: CreateCategoryDto) => api.post<Category>('/categories', dto).then(r => r.data),
  update: (id: number, dto: CreateCategoryDto) => api.put<Category>(`/categories/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};
