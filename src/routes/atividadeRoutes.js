const express = require('express');
const router = express.Router();
const AtividadeController = require('../controllers/AtividadeController');

// Quando houver um GET nesta rota, lista as atividades
router.get('/', AtividadeController.index);

// Quando houver um POST, cria uma nova atividade
router.post('/', AtividadeController.create);

module.exports = router;