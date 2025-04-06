const mongoose = require('mongoose');

const reserveSchema = new mongoose.Schema({
  assetType: {
    type: String,
    enum: ['cash', 'government_bond', 't_bill', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true,
    comment: 'Value in TSH'
  },
  issuer: {
    type: String,
    required: true
  },
  maturityDate: {
    type: Date,
    required: function() {
      return this.assetType !== 'cash';
    }
  },
  interestRate: {
    type: Number,
    required: function() {
      return this.assetType !== 'cash';
    }
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'redeemed'],
    default: 'active'
  },
  documentReference: {
    type: String,
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

const Reserve = mongoose.model('Reserve', reserveSchema);

module.exports = Reserve;
