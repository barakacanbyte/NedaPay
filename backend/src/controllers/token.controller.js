const TokenSupply = require('../models/token.model');
const { ethers } = require('ethers');
const TSHC_ABI = require('../../artifacts/contracts/TSHC.sol/TSHC.json').abi;

// Get current token supply information
exports.getTokenSupply = async (req, res) => {
  try {
    const tokenSupply = await TokenSupply.findOne().sort({ createdAt: -1 });
    
    if (!tokenSupply) {
      return res.status(404).json({
        success: false,
        error: 'Token supply information not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tokenSupply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update token supply from blockchain
exports.updateTokenSupply = async (req, res) => {
  try {
    const { contractAddress } = req.body;
    
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Valid contract address is required'
      });
    }
    
    // Connect to Base Sepolia network
    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');
    const tshcContract = new ethers.Contract(contractAddress, TSHC_ABI, provider);
    
    // Get total supply from contract
    const totalSupply = await tshcContract.totalSupply();
    
    // Find existing token supply record or create new one
    let tokenSupply = await TokenSupply.findOne({ contractAddress });
    
    if (tokenSupply) {
      tokenSupply = await TokenSupply.findByIdAndUpdate(
        tokenSupply._id,
        {
          totalSupply: totalSupply.toString(),
          circulatingSupply: totalSupply.toString(), // Assuming all tokens are in circulation
          lastUpdated: new Date()
        },
        { new: true }
      );
    } else {
      tokenSupply = await TokenSupply.create({
        totalSupply: totalSupply.toString(),
        circulatingSupply: totalSupply.toString(),
        totalReserveValue: totalSupply.toString(), // Assuming 1:1 backing initially
        backingRatio: 1.0,
        lastUpdated: new Date(),
        contractAddress,
        network: 'base-testnet'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tokenSupply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Manually update token supply information
exports.manualUpdateTokenSupply = async (req, res) => {
  try {
    const {
      totalSupply,
      circulatingSupply,
      totalReserveValue,
      backingRatio,
      contractAddress,
      network
    } = req.body;
    
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Valid contract address is required'
      });
    }
    
    // Find existing token supply record or create new one
    let tokenSupply = await TokenSupply.findOne({ contractAddress });
    
    if (tokenSupply) {
      tokenSupply = await TokenSupply.findByIdAndUpdate(
        tokenSupply._id,
        {
          totalSupply: totalSupply || tokenSupply.totalSupply,
          circulatingSupply: circulatingSupply || tokenSupply.circulatingSupply,
          totalReserveValue: totalReserveValue || tokenSupply.totalReserveValue,
          backingRatio: backingRatio || tokenSupply.backingRatio,
          lastUpdated: new Date(),
          network: network || tokenSupply.network
        },
        { new: true }
      );
    } else {
      tokenSupply = await TokenSupply.create({
        totalSupply: totalSupply || '0',
        circulatingSupply: circulatingSupply || '0',
        totalReserveValue: totalReserveValue || '0',
        backingRatio: backingRatio || 1.0,
        lastUpdated: new Date(),
        contractAddress,
        network: network || 'base-testnet'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tokenSupply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get token supply history
exports.getTokenSupplyHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const history = await TokenSupply.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await TokenSupply.countDocuments();
    
    res.status(200).json({
      success: true,
      count: history.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
