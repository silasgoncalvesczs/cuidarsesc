const express = require('express');
const router = express.Router();
const AtividadeController = require('../controllers/AtividadeController');
const { autenticar, autenticarOpcional, autorizar } = require('../middleware/auth');

const podeGerir = [autenticar, autorizar('admin', 'gestor')];
const podeCriar = [autenticar, autorizar('admin', 'gestor', 'operador')];

// Listagem: pública (só ativas). Com login, filtros avançados via autenticarOpcional.
router.get('/', autenticarOpcional, AtividadeController.index);
router.post('/', ...podeCriar, AtividadeController.create);
router.get('/:id', ...podeGerir, AtividadeController.show);
router.put('/:id', ...podeGerir, AtividadeController.update);
router.patch('/:id/status', ...podeGerir, AtividadeController.atualizarStatus);
router.delete('/:id', ...podeGerir, AtividadeController.remove);

module.exports = router;
