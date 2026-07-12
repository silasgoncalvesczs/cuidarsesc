const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { autenticar, autenticarOpcional, autorizar } = require('../middleware/auth');

// Login é sempre público
router.post('/login', UsuarioController.login);

// Criar usuário: público SÓ se for o primeiro do sistema (bootstrap do admin).
// Depois disso, exige token de admin (checado dentro do controller).
router.post('/', autenticarOpcional, UsuarioController.create);

// Listar usuários: só admin
router.get('/', autenticar, autorizar('admin'), UsuarioController.index);

module.exports = router;