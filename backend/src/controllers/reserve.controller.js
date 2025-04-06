const Reserve = require('../models/reserve.model');
const TokenSupply = require('../models/token.model');

// Get all reserves with pagination
exports.getAllReserves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reserves = await Reserve.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Reserve.countDocuments();
    
    res.status(200).json({
      success: true,
      count: reserves.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reserves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get reserve by ID
exports.getReserveById = async (req, res) => {
  try {
    const reserve = await Reserve.findById(req.params.id);
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        error: 'Reserve not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: reserve
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new reserve asset
exports.createReserve = async (req, res) => {
  try {
    const {
      assetType,
      amount,
      value,
      issuer,
      maturityDate,
      interestRate,
      purchaseDate,
      status,
      documentReference,
      notes
    } = req.body;
    
    const reserve = await Reserve.create({
      assetType,
      amount,
      value,
      issuer,
      maturityDate,
      interestRate,
      purchaseDate: purchaseDate || Date.now(),
      status: status || 'active',
      documentReference,
      notes
    });
    
    // Update total reserve value
    await updateTokenReserveRatio();
    
    res.status(201).json({
      success: true,
      data: reserve
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a reserve asset
exports.updateReserve = async (req, res) => {
  try {
    const reserve = await Reserve.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        error: 'Reserve not found'
      });
    }
    
    // Update total reserve value
    await updateTokenReserveRatio();
    
    res.status(200).json({
      success: true,
      data: reserve
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a reserve asset
exports.deleteReserve = async (req, res) => {
  try {
    const reserve = await Reserve.findByIdAndDelete(req.params.id);
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        error: 'Reserve not found'
      });
    }
    
    // Update total reserve value
    await updateTokenReserveRatio();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get reserve statistics
exports.getReserveStats = async (req, res) => {
  try {
    // Calculate total reserve value
    const reserves = await Reserve.find({ status: 'active' });
    
    let totalValue = 0;
    let totalByAssetType = {
      cash: 0,
      government_bond: 0,
      t_bill: 0,
      other: 0
    };
    
    reserves.forEach(reserve => {
      totalValue += reserve.value;
      totalByAssetType[reserve.assetType] += reserve.value;
    });
    
    // Get token supply info
    const tokenSupply = await TokenSupply.findOne().sort({ createdAt: -1 });
    
    const stats = {
      totalReserveValue: totalValue.toString(),
      totalReservesByType: totalByAssetType,
      reserveCount: reserves.length,
      tokenSupply: tokenSupply ? tokenSupply.totalSupply : '0',
      backingRatio: tokenSupply ? (totalValue / parseFloat(tokenSupply.totalSupply)).toFixed(2) : '1.00',
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

// Helper function to update token reserve ratio
async function updateTokenReserveRatio() {
  try {
    // Calculate total reserve value
    const reserves = await Reserve.find({ status: 'active' });
    
    let totalValue = 0;
    reserves.forEach(reserve => {
      totalValue += reserve.value;
    });
    
    // Get latest token supply
    const tokenSupply = await TokenSupply.findOne().sort({ createdAt: -1 });
    
    if (tokenSupply) {
      // Update token supply with new reserve value and ratio
      await TokenSupply.findByIdAndUpdate(
        tokenSupply._id,
        {
          totalReserveValue: totalValue.toString(),
          backingRatio: parseFloat(tokenSupply.totalSupply) > 0 
            ? (totalValue / parseFloat(tokenSupply.totalSupply)).toFixed(2) 
            : 1.0,
          lastUpdated: new Date()
        },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error updating token reserve ratio:', error);
  }
}
