const mongoose = require('mongoose');

const tokenSupplySchema = new mongoose.Schema({
  totalSupply: {
    type: String,
    required: true,
    default: '0'
  },
  circulatingSupply: {
    type: String,
    required: true,
    default: '0'
  },
  totalReserveValue: {
    type: String,
    required: true,
    default: '0'
  },
  backingRatio: {
    type: Number,
    required: true,
    default: 1.0,
    min: 1.0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  },
  contractAddress: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true,
    default: 'base-testnet'
  }
}, { timestamps: true });

const TokenSupply = mongoose.model('TokenSupply', tokenSupplySchema);

module.exports = TokenSupply;
