const express = require('express');
const router = express.Router();
const RelatorioController = require('../controllers/RelatorioController');
const { autenticar, autorizar } = require('../middleware/auth');

const podeRelatorio = [autenticar, autorizar('admin', 'gestor')];

router.get('/atividades', ...podeRelatorio, RelatorioController.atividades);
router.get('/presencas', ...podeRelatorio, RelatorioController.presencas);
router.get('/participantes', ...podeRelatorio, RelatorioController.participantes);

module.exports = router;
