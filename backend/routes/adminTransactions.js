import { Router } from 'express'
import {
  getAdminTransaction,
  listAdminTransactions,
} from '../controllers/transactionController.js'

const router = Router()

router.get('/', listAdminTransactions)
router.get('/:id', getAdminTransaction)

export default router
