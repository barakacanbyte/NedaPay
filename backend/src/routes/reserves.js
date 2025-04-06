const express = require('express');
const router = express.Router();
const reserveController = require('../controllers/reserve.controller');

// GET all reserves
router.get('/', reserveController.getAllReserves);

// GET reserve by ID
router.get('/:id', reserveController.getReserveById);

// POST create new reserve
router.post('/', reserveController.createReserve);

// PUT update reserve
router.put('/:id', reserveController.updateReserve);

// DELETE reserve
router.delete('/:id', reserveController.deleteReserve);

// GET reserve statistics
router.get('/stats/summary', reserveController.getReserveStats);

module.exports = router;
