const express = require('express');
const router = express.Router();
const CategoriaController = require('../controllers/CategoriaController');
const { autenticar, autorizar } = require('../middleware/auth');

const podeUsar = [autenticar, autorizar('admin', 'gestor', 'operador')];
const podeGerir = [autenticar, autorizar('admin', 'gestor')];

router.get('/', ...podeUsar, CategoriaController.index);
router.post('/', ...podeGerir, CategoriaController.create);
router.put('/:id', ...podeGerir, CategoriaController.update);
router.patch('/:id/status', ...podeGerir, CategoriaController.atualizarStatus);
router.delete('/:id', ...podeGerir, CategoriaController.remove);

module.exports = router;
