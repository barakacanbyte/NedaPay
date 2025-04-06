const Transaction = require('../models/transaction.model');
const { ethers } = require('ethers');

// Get all transactions with pagination
exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments();
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get transaction by hash
exports.getTransactionByHash = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ txHash: req.params.hash });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get transactions by address (sender or receiver)
exports.getTransactionsByAddress = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const address = req.params.address.toLowerCase();
    
    const transactions = await Transaction.find({
      $or: [
        { from: address },
        { to: address }
      ]
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments({
      $or: [
        { from: address },
        { to: address }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new transaction (usually called by blockchain event listener)
exports.createTransaction = async (req, res) => {
  try {
    const {
      txHash,
      from,
      to,
      amount,
      blockNumber,
      timestamp,
      status,
      transactionType,
      gasUsed,
      gasPrice,
      network
    } = req.body;
    
    // Validate transaction hash format
    if (!ethers.isHexString(txHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }
    
    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ txHash });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        error: 'Transaction already exists'
      });
    }
    
    const transaction = await Transaction.create({
      txHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount,
      blockNumber,
      timestamp: timestamp || Date.now(),
      status: status || 'confirmed',
      transactionType,
      gasUsed,
      gasPrice,
      network: network || 'base-testnet'
    });
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update transaction status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }
    
    const transaction = await Transaction.findOneAndUpdate(
      { txHash: req.params.hash },
      { status },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    
    const mintTransactions = await Transaction.countDocuments({ transactionType: 'mint' });
    const burnTransactions = await Transaction.countDocuments({ transactionType: 'burn' });
    const transferTransactions = await Transaction.countDocuments({ transactionType: 'transfer' });
    
    const stats = {
      totalTransactions,
      mintTransactions,
      burnTransactions,
      transferTransactions,
      lastUpdated: new Date()
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
