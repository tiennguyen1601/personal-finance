# Savings Feature Design
Date: 2026-05-19

## Overview

Add a Savings (Tiết kiệm) feature that lets users track savings goals separately from income/expense transactions. Saving money reduces the balance but is never counted as an expense.

## Requirements

- Users can create named savings goals (with icon, color, target amount, optional deadline)
- One default goal "Tiết kiệm chung" exists per user — always present, no target, cannot be deleted
- Each goal can receive deposit entries (amount, note, date)
- Balance = TotalIncome - TotalExpense - TotalSaved (per month)
- When a goal reaches its target amount, it shows a "Hoàn thành 🎉" badge (no withdrawal flow needed)
- Savings entries can be deleted (undoes the balance deduction)

## Data Model

### SavingsGoal
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| UserId | int | FK → Users |
| Name | string | e.g. "Mua điện thoại" |
| Icon | string | emoji |
| Color | string | hex color |
| TargetAmount | decimal? | null = no target (default goal) |
| Deadline | DateTime? | optional |
| IsDefault | bool | true = "Tiết kiệm chung", cannot be deleted |
| CreatedAt | DateTime | |

### SavingsEntry
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| SavingsGoalId | int | FK → SavingsGoals |
| Amount | decimal | positive only |
| Note | string? | optional |
| Date | DateTime | |
| CreatedAt | DateTime | |

## API Endpoints

### Goals
- `GET /api/savings` — list all goals for current user, each includes `CurrentAmount` (sum of entries) and `IsCompleted`
- `POST /api/savings` — create new goal
- `PUT /api/savings/{id}` — update goal (name, icon, color, target, deadline)
- `DELETE /api/savings/{id}` — delete goal + all entries (blocked if IsDefault)

### Entries
- `POST /api/savings/{goalId}/entries` — add deposit entry
- `DELETE /api/savings/entries/{id}` — delete entry

### Statistics change
- `GET /api/statistics/summary` — add `TotalSaved` field to `SummaryDto`
- Balance = TotalIncome - TotalExpense - TotalSaved (all savings entries in the given month)

## Frontend Pages

### Sidebar
Add "Tiết kiệm 🐷" nav item linking to `/savings`

### /savings page
- Header: "Tiết kiệm" + "+ Tạo mục tiêu" button
- List of goal cards, each showing:
  - Icon, name, color accent
  - Progress bar: CurrentAmount / TargetAmount (no bar if no target)
  - "Hoàn thành 🎉" badge when CurrentAmount >= TargetAmount
  - Deadline if set
  - "+ Nạp tiền" button
  - Edit / Delete buttons (delete hidden for default goal)
- Default goal "Tiết kiệm chung" always appears first

### Modals
- **Tạo/Sửa mục tiêu**: Name (required), Icon picker, Color picker, Target amount (optional), Deadline (optional)
- **Nạp tiền**: Amount (required), Note (optional), Date (default today)

### Dashboard change
- Add 4th summary card: "Đã tiết kiệm" showing TotalSaved for current month (blue-purple accent)
- Balance card now reflects Income - Expense - Saved

## Seeding

On user registration (or first login), auto-create the default `SavingsGoal` with `IsDefault=true`, Name="Tiết kiệm chung", Icon="🐷", Color="#8b5cf6".

## Out of Scope
- Withdrawing from savings (returning money to balance)
- Savings history chart
- Multiple currencies
