import { sessionsService } from './treasury/sessions.service'
import { budgetsService } from './treasury/budgets.service'
import { transactionsService } from './treasury/transactions.service'

export const treasuryService = {
  ...sessionsService,
  ...budgetsService,
  ...transactionsService,
}
