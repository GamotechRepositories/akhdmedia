import { Router } from 'express'
import {
  deleteAdminTransaction,
  getAdminTransaction,
  listAdminTransactions,
} from '../controllers/transactionController.js'

const router = Router()

router.get('/', listAdminTransactions)
router.get('/:id', getAdminTransaction)
router.delete('/:id', deleteAdminTransaction)

export default router
