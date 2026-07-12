const express = require('express');
const router = express.Router();
const AtividadeController = require('../controllers/AtividadeController');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/', autenticar, autorizar('admin', 'gestor', 'operador'), AtividadeController.index);
router.post('/', autenticar, autorizar('admin', 'gestor', 'operador'), AtividadeController.create);

module.exports = router;