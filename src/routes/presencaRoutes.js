const express = require('express');
const router = express.Router();
const PresencaController = require('../controllers/PresencaController');

router.post('/identificar', PresencaController.identificar);
router.post('/confirmar', PresencaController.confirmar);

module.exports = router;