const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// GET all transactions
router.get('/', transactionController.getAllTransactions);

// GET transaction by hash
router.get('/hash/:hash', transactionController.getTransactionByHash);

// GET transactions by address
router.get('/address/:address', transactionController.getTransactionsByAddress);

// POST create new transaction
router.post('/', transactionController.createTransaction);

// PUT update transaction status
router.put('/hash/:hash', transactionController.updateTransactionStatus);

// GET transaction statistics
router.get('/stats', transactionController.getTransactionStats);

module.exports = router;
