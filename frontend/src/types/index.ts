export interface User {
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
}

export type TransactionType = 'Income' | 'Expense';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  note?: string;
  date: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  categoryId: number;
  note?: string;
  date: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlyData {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface ByCategoryData {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
