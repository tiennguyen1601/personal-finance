import { collection, getDocs } from 'firebase/firestore';
import { db, requireUid } from './firebase';
import { transactionService } from './transactionService';
import type { Summary, MonthlyData, ByCategoryData } from '../types';

const sum = (arr: { amount: number }[]) => arr.reduce((s, x) => s + x.amount, 0);

export const statisticsService = {
  getSummary: async (): Promise<Summary> => {
    const uid = requireUid();
    // Lấy TẤT CẢ giao dịch (không lọc tháng/năm) để tính all-time
    const txs = await transactionService.getAll({});
    const totalIncome = sum(txs.filter((t) => t.type === 'Income'));
    const totalExpense = sum(txs.filter((t) => t.type === 'Expense'));

    // Lấy TẤT CẢ entries tiết kiệm (all-time) - khớp với trang Savings
    const entriesSnap = await getDocs(collection(db, 'users', uid, 'savingsEntries'));
    const totalSaved = entriesSnap.docs
      .map((d) => d.data() as { amount: number })
      .reduce((s, e) => s + e.amount, 0);

    return {
      totalIncome,
      totalExpense,
      totalSaved,
      balance: totalIncome - totalExpense - totalSaved,
    };
  },

  getSummaryByMonth: async (month: number, year: number): Promise<Summary> => {
    const uid = requireUid();
    // Lấy giao dịch của tháng/năm cụ thể
    const txs = await transactionService.getAll({ month, year });
    const totalIncome = sum(txs.filter((t) => t.type === 'Income'));
    const totalExpense = sum(txs.filter((t) => t.type === 'Expense'));

    // Lấy savings entries của tháng/năm cụ thể
    const entriesSnap = await getDocs(collection(db, 'users', uid, 'savingsEntries'));
    const totalSaved = entriesSnap.docs
      .map((d) => d.data() as { amount: number; date: string })
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .reduce((s, e) => s + e.amount, 0);

    return {
      totalIncome,
      totalExpense,
      totalSaved,
      balance: totalIncome - totalExpense - totalSaved,
    };
  },

  getMonthly: async (year: number): Promise<MonthlyData[]> => {
    const txs = await transactionService.getAll({ year });
    const result: MonthlyData[] = [];
    for (let m = 1; m <= 12; m++) {
      const inMonth = txs.filter((t) => Number(t.date.slice(5, 7)) === m);
      result.push({
        month: m,
        year,
        income: sum(inMonth.filter((t) => t.type === 'Income')),
        expense: sum(inMonth.filter((t) => t.type === 'Expense')),
      });
    }
    return result;
  },

  getByCategory: async (month: number, year: number): Promise<ByCategoryData[]> => {
    const txs = await transactionService.getAll({ month, year, type: 'Expense' });
    const total = sum(txs);

    const map = new Map<string, ByCategoryData>();
    for (const t of txs) {
      const existing = map.get(t.categoryId);
      if (existing) {
        existing.amount += t.amount;
      } else {
        map.set(t.categoryId, {
          categoryId: t.categoryId,
          categoryName: t.categoryName,
          categoryIcon: t.categoryIcon,
          categoryColor: t.categoryColor,
          amount: t.amount,
          percentage: 0,
        });
      }
    }

    const arr = [...map.values()];
    arr.forEach((d) => {
      d.percentage = total > 0 ? Math.round((d.amount / total) * 100) : 0;
    });
    return arr.sort((a, b) => b.amount - a.amount);
  },
};
