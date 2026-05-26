export type SessionBudget = {
  planned_budget: number
  reserved_amount: number
  spent_amount: number
  remaining_amount: number
}

export function updateSessionBudget(
  type: 'gain' | 'expense_paid' | 'expense_reserved',
  amount: number,
  session: SessionBudget,
): SessionBudget {
  const result = { ...session }
  if (type === 'gain') {
    result.planned_budget += amount
    result.remaining_amount += amount
  } else if (type === 'expense_paid') {
    result.spent_amount += amount
    result.remaining_amount -= amount
  } else if (type === 'expense_reserved') {
    result.reserved_amount += amount
    result.remaining_amount -= amount
  }
  return result
}

export function revertSessionBudget(
  type: 'gain' | 'expense_paid' | 'expense_reserved',
  amount: number,
  session: SessionBudget,
): SessionBudget {
  const result = { ...session }
  if (type === 'gain') {
    result.planned_budget -= amount
    result.remaining_amount -= amount
  } else if (type === 'expense_paid') {
    result.spent_amount -= amount
    result.remaining_amount += amount
  } else if (type === 'expense_reserved') {
    result.reserved_amount -= amount
    result.remaining_amount += amount
  }
  return result
}

export type ActivityBudgetBalance = {
  spent_amount: number
  remaining_amount: number
  allocated_amount: number
}

export function updateActivityBudgetSpent(
  budget: ActivityBudgetBalance,
  amount: number,
  increase: boolean,
): { spent_amount: number; remaining_amount: number } {
  if (increase) {
    const newSpent = (budget.spent_amount || 0) + amount
    const newRemaining = budget.allocated_amount - newSpent
    return { spent_amount: newSpent, remaining_amount: Math.max(0, newRemaining) }
  }
  const newSpent = Math.max(0, (budget.spent_amount || 0) - amount)
  const newRemaining = budget.allocated_amount - newSpent
  return { spent_amount: newSpent, remaining_amount: Math.max(0, newRemaining) }
}
