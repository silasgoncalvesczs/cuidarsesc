const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { autenticar, autenticarOpcional, autorizar } = require('../middleware/auth');

const soAdmin = [autenticar, autorizar('admin')];

router.post('/login', UsuarioController.login);
router.post('/', autenticarOpcional, UsuarioController.create);

router.get('/me', autenticar, UsuarioController.me);
router.patch('/me/senha', autenticar, UsuarioController.alterarSenha);

router.get('/', ...soAdmin, UsuarioController.index);
router.get('/:id', ...soAdmin, UsuarioController.show);
router.put('/:id', ...soAdmin, UsuarioController.update);
router.patch('/:id/status', ...soAdmin, UsuarioController.atualizarStatus);
router.delete('/:id', ...soAdmin, UsuarioController.remove);

module.exports = router;
