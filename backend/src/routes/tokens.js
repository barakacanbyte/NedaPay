const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');

// GET current token supply information
router.get('/supply', tokenController.getTokenSupply);

// POST update token supply from blockchain
router.post('/update-supply', tokenController.updateTokenSupply);

// PUT manually update token supply
router.put('/supply', tokenController.manualUpdateTokenSupply);

// GET token supply history
router.get('/supply/history', tokenController.getTokenSupplyHistory);

module.exports = router;
