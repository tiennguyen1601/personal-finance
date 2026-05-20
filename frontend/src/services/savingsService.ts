import api from './api';
import type { SavingsGoal, CreateSavingsGoalDto, CreateSavingsEntryDto } from '../types';

export const savingsService = {
  getAll: () => api.get<SavingsGoal[]>('/savings').then(r => r.data),
  create: (dto: CreateSavingsGoalDto) => api.post<SavingsGoal>('/savings', dto).then(r => r.data),
  update: (id: number, dto: CreateSavingsGoalDto) => api.put<SavingsGoal>(`/savings/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/savings/${id}`),
  addEntry: (goalId: number, dto: CreateSavingsEntryDto) =>
    api.post(`/savings/${goalId}/entries`, dto).then(r => r.data),
  deleteEntry: (entryId: number) => api.delete(`/savings/entries/${entryId}`),
};
