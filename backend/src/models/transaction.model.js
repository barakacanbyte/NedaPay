const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  transactionType: {
    type: String,
    enum: ['mint', 'burn', 'transfer', 'approve'],
    required: true
  },
  gasUsed: {
    type: String
  },
  gasPrice: {
    type: String
  },
  network: {
    type: String,
    required: true,
    default: 'base-testnet'
  }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
