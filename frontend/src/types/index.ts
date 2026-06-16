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
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  note?: string;
  date: string;
  createdAt: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  categoryId: string;
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
  totalSaved: number;
  balance: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number | null;
  deadline: string | null;
  isDefault: boolean;
  currentAmount: number;
  isCompleted: boolean;
}

export interface CreateSavingsGoalDto {
  name: string;
  icon: string;
  color: string;
  targetAmount: number | null;
  deadline: string | null;
}

export interface CreateSavingsEntryDto {
  amount: number;
  note?: string;
  date: string;
}

export interface MonthlyData {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface ByCategoryData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
