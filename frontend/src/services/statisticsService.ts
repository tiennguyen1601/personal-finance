import api from './api';
import type { Summary, MonthlyData, ByCategoryData } from '../types';

export const statisticsService = {
  getSummary: (month: number, year: number) =>
    api.get<Summary>('/statistics/summary', { params: { month, year } }).then(r => r.data),
  getMonthly: (year: number) =>
    api.get<MonthlyData[]>('/statistics/monthly', { params: { year } }).then(r => r.data),
  getByCategory: (month: number, year: number) =>
    api.get<ByCategoryData[]>('/statistics/by-category', { params: { month, year } }).then(r => r.data),
};
