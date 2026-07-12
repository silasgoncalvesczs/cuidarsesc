const express = require('express');
const router = express.Router();
const AtividadeController = require('../controllers/AtividadeController');
const { autenticar, autorizar } = require('../middleware/auth');

const podeUsar = [autenticar, autorizar('admin', 'gestor', 'operador')];
const podeGerir = [autenticar, autorizar('admin', 'gestor')];

router.get('/', ...podeUsar, AtividadeController.index);
router.post('/', ...podeUsar, AtividadeController.create);
router.get('/:id', ...podeGerir, AtividadeController.show);
router.put('/:id', ...podeGerir, AtividadeController.update);
router.patch('/:id/status', ...podeGerir, AtividadeController.atualizarStatus);
router.delete('/:id', ...podeGerir, AtividadeController.remove);

module.exports = router;
