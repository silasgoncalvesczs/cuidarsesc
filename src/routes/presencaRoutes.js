const express = require('express');
const router = express.Router();
const PresencaController = require('../controllers/PresencaController');
const { autenticar, autorizar } = require('../middleware/auth');

router.post('/identificar', autenticar, autorizar('admin', 'gestor', 'operador'), PresencaController.identificar);
router.post('/confirmar', autenticar, autorizar('admin', 'gestor', 'operador'), PresencaController.confirmar);

module.exports = router;