import api from './api';
import type { Transaction, CreateTransactionDto } from '../types';

export const transactionService = {
  getAll: (params?: { month?: number; year?: number; categoryId?: number; type?: string }) =>
    api.get<Transaction[]>('/transactions', { params }).then(r => r.data),
  create: (dto: CreateTransactionDto) => api.post<Transaction>('/transactions', dto).then(r => r.data),
  update: (id: number, dto: CreateTransactionDto) => api.put<Transaction>(`/transactions/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
};
